let sqlDoc = (
    `<soapenv:Envelope
      xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:ns="http://www.cisco.com/AXL/API/%version%">
      <soapenv:Header/>
      <soapenv:Body>
          <ns:executeSQL%action% >
            <sql>%statement%</sql>
          </ns:executeSQL%action%>
      </soapenv:Body>
    </soapenv:Envelope>`
  ),
  axlHeaders = {
    'Content-Type': 'text/xml',
    'SOAPAction': 'CUCM:DB ver='
  },
  headers = { 'Content-Type': 'text/xml', 'Accept': 'text/xml' },
  phModelQuery = (
    `SELECT enum as modelnumber, name as modelname  
      FROM typemodel
      WHERE name NOT LIKE "%Expansion Module%"
      AND name!="SPA8800" AND name NOT MATCHES "*79[0123]*"
      AND name NOT MATCHES "*6911*"
      AND (name MATCHES "*7[89]*"
      OR name MATCHES "*[89][89]*"
      OR name MATCHES "*69*")`
  ),
  devAssQuery = (
    `SELECT d.name as devicename from device as d
      inner join enduserdevicemap as eudmap on d.pkid = eudmap.fkdevice
      inner join enduser as eu on eudmap.fkenduser = eu.pkid
      where eu.userid="%user%" and eudmap.tkuserassociation=1`
  ),
  updDevAssoc = (
    `INSERT INTO enduserdevicemap (fkdevice,fkenduser,pkid,tkuserassociation) VALUES(
      (select pkid from device where name="%devicename%"),
      (select pkid from enduser where userid="%userid%"),
      newid(),
      1
    )`
  ),
  delDevAssoc = (
    `DELETE FROM enduserdevicemap
    where fkenduser=(SELECT pkid from enduser where userid="%userid") AND
    fkdevice=(SELECT pkid from device where name="%devicename%")`
  ),
  userPermissions = (
    `SELECT DISTINCT(fr.name) as permissionrole FROM DirGroup as dg
      INNER JOIN functionroledirgroupmap as frdgm on frdgm.fkdirgroup = dg.pkid
      INNER JOIN functionrole as fr on frdgm.fkfunctionrole=fr.pkid
      INNER JOIN enduserdirgroupmap as eudgm on eudgm.fkdirgroup = dg.pkid
      INNER JOIN enduser as eu on eu.pkid = eudgm.fkenduser
      WHERE eu.userid="%userid%"`
  );

export {
  sqlDoc, axlHeaders, headers,
  phModelQuery, devAssQuery, updDevAssoc,
  userPermissions, delDevAssoc
};