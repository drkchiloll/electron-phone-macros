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
  risDoc = (
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:soap="http://schemas.cisco.com/ast/soap"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <soapenv:Header/>
      <soapenv:Body>
        <soap:selectCmDevice xmlns:ns1="http://schemas.cisco.com/ast/soap/"
                              soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
                              xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
            <soap:StateInfo/>
            <soap:CmSelectionCriteria>
              <soap:MaxReturnedDevices>1000</soap:MaxReturnedDevices>
              <soap:Class>Phone</soap:Class>
              <soap:DeviceClass>Phone</soap:DeviceClass>
              <soap:Model>255</soap:Model>
              <soap:Status>Registered</soap:Status>
              <soap:NodeName xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>
              <soap:SelectBy>IPV4Address</soap:SelectBy>
              <soap:SelectItems>
                  <soap:item>
                    <soap:Item>%ipaddress%</soap:Item>
                  </soap:item>
              </soap:SelectItems>
              <soap:Protocol>Any</soap:Protocol>
              <soap:DownloadStatus>Any</soap:DownloadStatus>
            </soap:CmSelectionCriteria>
        </soap:selectCmDevice>
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
      AND (name MATCHES "*7[89]*"
      OR name MATCHES "*[89][89]*")`
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
  );

export {
  sqlDoc, risDoc, axlHeaders, headers, phModelQuery, devAssQuery, updDevAssoc
};