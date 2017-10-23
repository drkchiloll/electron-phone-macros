export default (() => (
  `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://www.cisco.com/AXL/API/%version%">
    <soapenv:Header/>
    <soapenv:Body>
        <ns:executeSQL%action% >
          <sql>%statement%</sql>
        </ns:executeSQL%action%>
    </soapenv:Body>
  </soapenv:Envelope>`
))();