let risport70 = (
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
                <!--Zero or more repetitions:-->
             </soap:SelectItems>
             <soap:Protocol>Any</soap:Protocol>
             <soap:DownloadStatus>Any</soap:DownloadStatus>
          </soap:CmSelectionCriteria>
       </soap:selectCmDevice>
    </soapenv:Body>
 </soapenv:Envelope>`
);
export default risport70;