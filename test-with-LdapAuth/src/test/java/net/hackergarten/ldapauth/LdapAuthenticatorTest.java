/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package net.hackergarten.ldapauth;

import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.DirContext;
import javax.naming.directory.SearchControls;
import java.util.Hashtable;
import java.util.Map;

import org.hamcrest.CoreMatchers;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Matchers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

/**
 * Implement some basic test using a in memory LDAP server.
 *
 * see travis file on how the server is started.
 * Test data comes from ldapServer/file.LDIF
 *
 * ZIP file providing the test server comes from
 * https://github.com/madmas/ldap-sample-source-code
 */
public class LdapAuthenticatorTest {

    private static final String LDAP_TEST_SERVER = "ldap://localhost:1389/";

    @Test
    public void testCreateDnWithCustomUidExample() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        ldapAuthenticator.setUidProperty("cn");
        String dn = ldapAuthenticator.getDn("Demo User");
        assertEquals("cn=demo.user@example.com, ou=people, dc=example, dc=com",dn);
    }

    @Test
    public void testDefaultUid() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("dc=example,dc=com", LDAP_TEST_SERVER);
        assertEquals("uid", ldapAuthenticator.getUidProperty());
    }

    @Test
    public void testGetDn() throws Exception {
        //given
        LdapAuthenticator authenticatorSpy = spy(new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER));

        DirContext dirContext = mock(DirContext.class);
        doReturn(dirContext).when(authenticatorSpy).ldapContext((Hashtable<String, String>) Matchers.any());
        ArgumentCaptor<SearchControls> argumentCaptor = ArgumentCaptor.forClass(SearchControls.class);
        NamingEnumeration answer = mock(NamingEnumeration.class);
        doReturn(answer).when(dirContext).search(anyString(), anyString(), argumentCaptor.capture());

        //when
        authenticatorSpy.getDn("read-only-admin");

        //then
        assertEquals(SearchControls.SUBTREE_SCOPE,argumentCaptor.getValue().getSearchScope());
        verify(answer).close();
    }

    @Test
    public void testGetUidForUnknownUserReturnsNull() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        ldapAuthenticator.setUidProperty("cn");
        String uid = ldapAuthenticator.getDn("non-existent-user");
        assertNull(uid);
    }

    @Test
    public void testBind() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        boolean authenticated = ldapAuthenticator.testBind("cn=user@example.com,ou=people,dc=example,dc=com", "test");
        assertTrue(authenticated);
    }

    @Test
    public void testBind_SimpleAuthentication() throws Exception {
        LdapAuthenticator authenticatorSpy = spy(new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER));

        ArgumentCaptor<Hashtable> captor = ArgumentCaptor.forClass(Hashtable.class);
        doReturn(mock(DirContext.class)).when(authenticatorSpy).ldapContext(captor.capture());
        authenticatorSpy.testBind("cn=read-only-admin,dc=example,dc=com", "password");
        assertThat(captor.getValue().get(Context.SECURITY_AUTHENTICATION), CoreMatchers.<Object>is("simple"));
    }

    @Test
    public void testBindFailsOnInvalidPassword() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        boolean authenticated = ldapAuthenticator.testBind("cn=read-only-admin,dc=example,dc=org", "wrongPassword");
        assertFalse(authenticated);
    }

    @Test
    public void testSearch() throws Exception{
        // tag::search[]
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        ldapAuthenticator.setUidProperty("sn");
        ldapAuthenticator.setSearchAttributes("uid,cn,sn,mail");
        Map<String, String> result = ldapAuthenticator.search("User");
        assertNotNull(result);
        assertEquals(4,result.size());
        assertEquals("demo.user@example.com", result.get("uid"));
        assertEquals("demo.user@example.com", result.get("mail"));
        assertEquals("User", result.get("sn"));
        assertEquals("Demo User", result.get("cn"));
        // end::search[]
    }

    @Test
    public void testSearchForUnknownUserReturnsNull() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        ldapAuthenticator.setUidProperty("cn");
        Map<String, String> result = ldapAuthenticator.search("non-existent-user");
        assertNull(result);
    }

    @Test
    public void testSearchForUserWithWrongAttrsReturnsEmptyMap() throws Exception {
        LdapAuthenticator ldapAuthenticator = new LdapAuthenticator("ou=people,dc=example,dc=com", LDAP_TEST_SERVER);
        ldapAuthenticator.setUidProperty("sn");
        ldapAuthenticator.setSearchAttributes("sample,thing");
        Map<String, String> result = ldapAuthenticator.search("User");
        assertEquals(0,result.size());
    }
}
