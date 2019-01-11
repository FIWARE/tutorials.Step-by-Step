# Administrating XACML Rules

## Curl Commands

#### 3 Request

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/policies \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<PolicySet xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" PolicySetId="f8194af5-8a07-486a-9581-c1f05d05483c" Version="1" PolicyCombiningAlgId="urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:deny-unless-permit">
   <Description>Policy Set for Airplane!</Description>
   <Target />
   <Policy PolicyId="airplane" Version="1.0" RuleCombiningAlgId="urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit">
      <Description>Vehicle Roles from the Male announcer in the movie Airplane!</Description>
      <Target>
         <AnyOf>
            <AllOf>
               <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                  <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
                  <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
               </Match>
            </AllOf>
         </AnyOf>
      </Target>
      <Rule RuleId="white-zone" Effect="Permit">
         <Description>The white zone is for immediate loading and unloading of passengers only</Description>
         <Target>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">white</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
         </Target>
      </Rule>
      <Rule RuleId="red-zone" Effect="Deny">
         <Description>There is no stopping in the red zone</Description>
         <Target>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">red</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">stopping</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
         </Target>
      </Rule>
   </Policy>
</PolicySet>
'
```

[**(Click to RETURN)**](../administrating-xacml.md#3-request)

---

#### 7 Request

Remember to amend the request below to use your own `{domain-id}`:

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/{domain-id}/pap/policies \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<PolicySet xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" PolicySetId="f8194af5-8a07-486a-9581-c1f05d05483c" Version="2" PolicyCombiningAlgId="urn:oasis:names:tc:xacml:3.0:policy-combining-algorithm:deny-unless-permit">
   <Description>Policy Set for Airplane!</Description>
   <Target />
   <Policy PolicyId="airplane" Version="1.0" RuleCombiningAlgId="urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit">
      <Description>Vehicle Roles from the Female announcer in the movie Airplane!</Description>
      <Target>
         <AnyOf>
            <AllOf>
               <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                  <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">airplane!</AttributeValue>
                  <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
               </Match>
            </AllOf>
         </AnyOf>
      </Target>
      <Rule RuleId="red-zone" Effect="Permit">
         <Description>The red zone is for immediate loading and unloading of passengers only</Description>
         <Target>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">red</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">loading</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
         </Target>
      </Rule>
      <Rule RuleId="white-zone" Effect="Deny">
         <Description>There is no stopping in the white zone</Description>
         <Target>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">white</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
            <AnyOf>
               <AllOf>
                  <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                     <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">stopping</AttributeValue>
                     <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                  </Match>
               </AllOf>
            </AnyOf>
         </Target>
      </Rule>
   </Policy>
</PolicySet>
'
```

[**(Click to RETURN)**](../administrating-xacml.md#7-request)

---

#### 13 Request

The full `<Rule>`  is shown below:

```xml
<Rule RuleId="alrmbell-ring-24hr-hours-000000000000" Effect="Permit">
    <Description>Ring Alarm Bell (Outside Core Hours)</Description>
    <Target>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">/bell/ring</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">POST</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">security-role-0000-0000-000000000000</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject" AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
    </Target>
    <Condition>
        <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:not">
            <Apply FunctionId="urn:oasis:names:tc:xacml:2.0:function:time-in-range">
                <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:time-one-and-only">
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" AttributeId="urn:oasis:names:tc:xacml:1.0:environment:current-time" DataType="http://www.w3.org/2001/XMLSchema#time" MustBePresent="false" />
                </Apply>
                <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:time-one-and-only">
                    <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:time-bag">
                        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#time">08:00:00</AttributeValue>
                    </Apply>
                </Apply>
                <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:time-one-and-only">
                    <Apply FunctionId="urn:oasis:names:tc:xacml:1.0:function:time-bag">
                        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#time">17:00:00</AttributeValue>
                    </Apply>
                </Apply>
            </Apply>
        </Apply>
    </Condition>
</Rule>
```
The `<Target>` element of the `<Rule>` defines access on a Verb-Resource level
in a similar manner as seen in the previous tutorial. The a `<Condition>`
element holds the time part of the rule and is evaluated by **Authzforce** based
on the current server time.

[**(Click to RETURN)**](../administrating-xacml.md#13-request)

### Update an XACML Permission

The policy will now be updated as follows:

> **Security Staff** Can only ring the alarm bell before 9 a.m. or after 5 p.m.,
> except for **Charlie** who can ring the bell at any time

This means that the `alrmbell-ring-24hr-xaml-000000000000` permission will need
to be amended to apply two rules:

The full `<Rule>`  is shown below:

```xml
<Rule RuleId="alrmbell-ring-only-000000000000" Effect="Permit">
    <Description>Allow Full Access to Charlie the Security Manager</Description>
    <Target>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">/bell/ring</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource" AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">POST</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action" AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
        <AnyOf>
            <AllOf>
                <Match MatchId="urn:oasis:names:tc:xacml:1.0:function:string-equal">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">charlie</AttributeValue>
                    <AttributeDesignator Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject" AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-id" DataType="http://www.w3.org/2001/XMLSchema#string" MustBePresent="true" />
                </Match>
            </AllOf>
        </AnyOf>
    </Target>
</Rule>
```

[**(Click to RETURN)**](../administrating-xacml.md#update-an-xacml-permission)

#### 15 Request

```bash
curl -X PATCH \
  http://localhost:3005/v1/applications/tutorial-dckr-site-0000-xpresswebapp/permissions/alrmbell-ring-24hr-xaml-000000000000 \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-token: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' \
  -d '{
    "permission": {
        "action": "",
        "resource": "",
        "xml": "<Rule RuleId=\"alrmbell-ring-only-000000000000\" Effect=\"Permit\">\n<Description>Allow Full Access to Charlie the Security Manager</Description>\n<Target>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">/bell/ring</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\" AttributeId=\"urn:thales:xacml:2.0:resource:sub-resource-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">POST</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">charlie</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:subject:subject-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n</Target>\n</Rule>\n<Rule RuleId=\"alrmbell-ring-24hr-hours-000000000000\" Effect=\"Permit\">\n<Description>Ring Alarm Bell (Outside Core Hours)</Description>\n<Target>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">/bell/ring</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\" AttributeId=\"urn:thales:xacml:2.0:resource:sub-resource-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">POST</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n<AnyOf>\n<AllOf>\n<Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">security-role-0000-0000-000000000000</AttributeValue>\n<AttributeDesignator Category=\"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\" AttributeId=\"urn:oasis:names:tc:xacml:2.0:subject:role\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\" />\n</Match>\n</AllOf>\n</AnyOf>\n</Target>\n<Condition>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:not\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:2.0:function:time-in-range\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<AttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:environment:current-time\" DataType=\"http://www.w3.org/2001/XMLSchema#time\" Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:environment\" MustBePresent=\"false\"></AttributeDesignator>\n</Apply>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-bag\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#time\">08:00:00</AttributeValue>\n</Apply>\n</Apply>\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-one-and-only\">\n<Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:time-bag\">\n<AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#time\">17:00:00</AttributeValue>\n</Apply>\n</Apply>\n</Apply>\n</Apply>\n</Condition>\n</Rule>"
    }
}'
```

[**(Click to RETURN)**](../administrating-xacml.md#15-request)

---

#### 17 Request

```bash
curl -X POST \
  http://localhost:8080/authzforce-ce/domains/gQqnLOnIEeiBFQJCrBIBDA/pdp \
  -H 'Content-Type: application/xml' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">charlie</AttributeValue>
     </Attribute>
     <Attribute AttributeId="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">charlie-security@test.com</AttributeValue>
     </Attribute>
     <Attribute AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">security-role-0000-0000-000000000000</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">tutorial-dckr-site-0000-xpresswebapp</AttributeValue>
     </Attribute>
     <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">/bell/ring</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">POST</AttributeValue>
     </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />
</Request>'
```

[**(Click to RETURN)**](../administrating-xacml.md#18-Request)

---
