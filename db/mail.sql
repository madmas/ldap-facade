-- MySQL dump 10.13  Distrib 5.7.18, for Linux (x86_64)
--
-- Host: localhost    Database: mail
-- ------------------------------------------------------
-- Server version 5.7.18-0ubuntu0.16.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `domains`
--

DROP TABLE IF EXISTS `domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `domains` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(64) NOT NULL DEFAULT '',
  `categories` varchar(100) NOT NULL DEFAULT 'all',
  `owner` varchar(128) NOT NULL,
  `a_admin` text,
  `neu` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `domain` (`domain`),
  KEY `owner` (`owner`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domains`
--

LOCK TABLES `domains` WRITE;
/*!40000 ALTER TABLE `domains` DISABLE KEYS */;
INSERT INTO `domains` VALUES (3,'example.com','all, example.com','demo.user@example.com','demo.user@example.com,postmaster',0);
/*!40000 ALTER TABLE `domains` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `mbox` varchar(128) NOT NULL,
  `person` varchar(100) NOT NULL DEFAULT '',
  `pate` varchar(128) NOT NULL,
  `canonical` varchar(100) NOT NULL DEFAULT '',
  `password` varchar(40) NOT NULL DEFAULT '',
  `domains` varchar(100) NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `created` int(10) unsigned NOT NULL DEFAULT '0',
  `last_login` int(10) unsigned NOT NULL DEFAULT '0',
  `max_alias` int(10) unsigned NOT NULL DEFAULT '1',
  `max_regexp` int(10) unsigned NOT NULL DEFAULT '1',
  `a_admin_domains` tinyint(4) NOT NULL DEFAULT '0',
  `a_admin_user` tinyint(4) NOT NULL DEFAULT '0',
  `a_super` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`mbox`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES
  ('demo.user@example.com','Demo User','demo.user@example.com','demo.user@example.com','098f6bcd4621d373cade4e832627b4f6','example.com',1,1166395003,1494430401,100,1000,1,1,1),
  ('user@example.com','User','user@example.com','user@example.com','098f6bcd4621d373cade4e832627b4f6','example.com',1,1167319411,1262775829,5,5,0,0,0);

/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
ALTER TABLE `user` ADD COLUMN `passwd` VARCHAR(128) NOT NULL AFTER `password`;

--
-- Table structure for table `virtual`
--

DROP TABLE IF EXISTS `virtual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `virtual` (
  `address` varchar(255) NOT NULL DEFAULT '',
  `dest` text,
  `owner` varchar(128) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `neu` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`address`),
  KEY `owner` (`owner`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `virtual`
--

LOCK TABLES `virtual` WRITE;
/*!40000 ALTER TABLE `virtual` DISABLE KEYS */;
INSERT INTO `virtual` VALUES ('demo.user@example.com','demo.user@example.com','demo.user@example.com',1,0);
/*!40000 ALTER TABLE `virtual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `virtual_regexp`
--

DROP TABLE IF EXISTS `virtual_regexp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `virtual_regexp` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reg_exp` varchar(255) NOT NULL DEFAULT '',
  `dest` text,
  `owner` varchar(128) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `neu` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `owner` (`owner`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `virtual_regexp`
--

LOCK TABLES `virtual_regexp` WRITE;
UNLOCK TABLES;
