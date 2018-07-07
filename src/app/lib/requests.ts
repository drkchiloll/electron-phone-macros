process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import axios, { AxiosInstance } from 'axios';

export const req = (() => {
  const serv = {
    get(options: any) {
      axios.defaults.adapter = require('axios/lib/adapters/http');
      axios.defaults.validateStatus = status =>
        status >= 200 && status <= 505;
      return axios(options);
    }
  };
  return serv;
})()