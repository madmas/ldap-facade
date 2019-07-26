"use strict";
/*  ==============================================================
 Include required packages
 =============================================================== */

/* jshint node: true */

let fs = require("fs"),
    nconf = require("nconf"),
    path = require("path"),
    ldap = require("ldapjs"),
    Sequelize = require("sequelize"),
    crypto = require("crypto"),
    bunyan = require("bunyan"),
    logger = bunyan.createLogger({
        name: "ldapjs",
        component: "client",
        streams: [
            {
                path: "ldap-server.log"
            },
            {
                stream: process.stderr,
                level: "debug"
            }
        ],
        serializers: bunyan.stdSerializers
    });
let server,
    config, configFile;
const opts = {}, db = {}, models = {};
let dbTable;

/*  ==============================================================
 Configuration
 =============================================================== */

if ( process.argv[ 2 ] ) {
    if ( fs.lstatSync( process.argv[ 2 ] ) ) {
        configFile = require( process.argv[ 2 ] );
    } else {
        configFile = process.cwd() + "/config/settings.json";
    }
} else {
    configFile = process.cwd() + "/config/settings.json";
}

config = nconf
    .argv()
    .env("__")
    .file({ file: configFile });

if ( config.get("ldap:ssl") ) {
    if ( config.get("ldap:ssl:key") ) {
        logger.info("key:", config.get("ldap:ssl:key") );
        opts.key = fs.readFileSync( config.get("ldap:ssl:key") ).toString("utf8");
    }

    if ( config.get("ldap:ssl:cert") ) {
        logger.info("cert:", config.get("ldap:ssl:cert") );
        opts.certificate = fs.readFileSync( config.get("ldap:ssl:cert") ).toString("utf8");
    }

    if ( config.get("ldap:ssl:ca") ) {
        opts.ca = [];
        config.get("ldap:ssl:ca").forEach(function( ca, index, array ) {
            opts.ca.push( fs.readFileSync( ca ) );
        });
    }
}

if ( config.get("mysql") ) {
    db.mail = new Sequelize(
        config.get("mysql:database"),
        config.get("mysql:username"),
        config.get("mysql:password"),
        {
            dialect: "mysql",
            host: config.get("mysql:host") || "localhost",
            port: config.get("mysql:port") || 3306,
            pool: { maxConnections: 5, maxIdleTime: 30 },
            define: {
                freezeTableName: true,
                timestamps: false
            }
        }
    );
    dbTable = config.get("mysql:userTable");

} else if ( config.get("sqlite") ) {
    db.mail = new Sequelize(
        "",
        "",
        "",
        {
            dialect: "sqlite",
            storage: config.get("sqlite:storage")
        }
    );
    dbTable = config.get("sqlite:userTable");
}

models.Users = db.mail.define( dbTable,
    {
        password: { type: Sequelize.STRING( 106 ), field: "password" },
        passwd: { type: Sequelize.STRING( 128 ), field: "passwd" },
        mbox: { type: Sequelize.STRING( 120 ), field: "mbox", primaryKey: true },
        dn: {
            type: Sequelize.VIRTUAL, get() {
                const mbox = this.getDataValue("mbox");
                if ( mbox ) {
                    const fulldomain = mbox.replace( /.*@/, "");
                    const domain = fulldomain.split(".")[ 0 ];
                    const tld = fulldomain.split(".")[ 1 ];

                    return "cn=" + mbox + ",ou=people,dc=" + domain + ",dc=" + tld;
                }
                return "ERROR";
            }
        },
        cn: { type: Sequelize.STRING( 255 ), field: "person" },
        givenName: { type: Sequelize.VIRTUAL },
        sn: {
            type: Sequelize.VIRTUAL, get() {
                const name = this.getDataValue("cn");
                if ( name ) {
                    return name.split(" ")[ 1 ];
                }
                return "";
            }
        },
        uid: { type: Sequelize.STRING( 255 ), field: "canonical" },
        domain: { type: Sequelize.STRING( 255 ), field: "domains" }
    },
    {
        getterMethods: {
            mail: function() {
                return this.getDataValue("mbox");
            },
            givenName: function() {
                const name = this.getDataValue("cn");
                if ( name ) {
                    return name.split(" ")[ 0 ];
                }
                return "";
            }
        },
        setterMethods: {
            mail: function( v ) {
                this.setDataValue("mbox", v );
            }
        }
    }
);

opts.log = logger;
opts.cert = config.get("ldap:cert");
opts.key = config.get("ldap:key");
server = ldap.createServer( opts );
const port = config.get("ldap:port") || 389,
    dn = config.get("ldap:dn") || "dc=example,dc=com",
    baseDn = config.get("ldap:ou") + "," + config.get("ldap:dn") || "ou=people,dc=example,dc=com",
    adminUser = config.get("ldap:admin:user") || "admin",
    adminDn = "cn=" + adminUser + "," + baseDn,
    adminPassword = config.get("ldap:admin:password") || "thiswasunsecure";

server.listen( port, '0.0.0.0', function() {
    logger.info("ldapjs listening at " + server.url );
});

const bindHandler = function( req, res, next ) {
    const username = req.dn.toString(),
        password = req.credentials,
        noUser = function() {
            logger.info("Invalid credentials for:", username );
            return next( new ldap.InvalidCredentialsError() );
        },
        foundUser = function( user ) {
            logger.info("Login successful for:", user.mbox );
            res.end();
            return next();
        },
        updatePasswdAfterSuccessfulBind = function( user, password ) {
            const newhash = crypto.createHash("sha256").update( password ).digest("hex");

            models.Users.update({
                passwd: newhash
            }, {
                where: {
                    mbox: {
                        $eq: user.mbox
                    }
                }
            });

        };
    logger.info("Login attempt for:", username );
    if ( username === adminDn ) {
        if ( password === adminPassword ) {
            foundUser({ "givenName": "admin", "mbox": "virtual@admin" });
        } else {
            noUser();
        }
    } else {
        const extractedId = username.split(",")[ 0 ].replace("cn=", "");
        logger.info("Login attempt with identifier:", extractedId );
        models.Users.find({
            where: {
                mbox: extractedId
            }
        }).then(function( user ) {
            if ( user !== null ) {
                logger.info( user.password + " || " + req.credentials );
                const encPass = user.password,
                    hash = crypto.createHash("md5").update( password ).digest("hex");

                if ( hash === encPass ) {
                    updatePasswdAfterSuccessfulBind( user, password );
                    foundUser( user );
                } else {
                    noUser();
                }
            } else {
                noUser();
            }
        });
    }
};

server.bind( baseDn, bindHandler );

const searchHandler = function( req, res, next ) {
    const searchDn = req.dn.toString();
    logger.info("Search request dn: ", searchDn );

    let context = "";
    logger.info("search: ", searchDn);
    if ( searchDn.includes("example") ) {
        context = "example.com";
        logger.info("context set to example.com");
    } else {
        const split = searchDn.split(",");
        context = split[ split.length - 2 ].replace("dc=", "").trim();
    }
    logger.info("context set for search:", context );

    models.Users.findAll(
        {
            where: {
                domain: {
                    $eq: context
                }
            }
        }
    ).then(
        function( users ) {

            for ( let i = 0; i < users.length; i++ ) {
                let user = {
                    dn: users[ i ].dn,
                    attributes: {
                        objectclass: [ "top", "organization", "person" ]
                    }
                };

                Object.keys( users[ i ].dataValues ).forEach(function( key ) { // jshint ignore:line
                    user.attributes[ key ] = [ users[ i ].dataValues[ key ] ];
                });
                user.attributes.mail = users[ i ].mail;
                user.attributes.givenName = users[ i ].givenName;
                user.attributes.sn = users[ i ].sn;
                delete user.attributes.dn;
                // logger.info("Search found:", users[i].uid);
                if ( req.filter.matches( user.attributes ) ) {
                    logger.info("send user: ", user );
                    res.send( user );
                }
            }
            res.end();
        }
    );
};

server.search( baseDn, searchHandler );

