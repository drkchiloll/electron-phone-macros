process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https'

const request: AxiosInstance = axios.create({
  adapter: require('axios/lib/adapters/http'),
  validateStatus: status => status >= 200 && status <= 505,
  httpsAgent: new Agent({ rejectUnauthorized: false })
})

export const req = (() => {
  const serv = {
    handleResponse() {},
    get(options: any) {
      return request(options);
    },
    post(options: any) {
      options['method'] = 'post';
      return request(options);
    }
  };
  return serv;
})()