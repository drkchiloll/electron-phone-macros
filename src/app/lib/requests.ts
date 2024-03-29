process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https'

const request: AxiosInstance = axios.create({
  adapter: require('axios/lib/adapters/http'),
  validateStatus: status => status >= 200 && status <= 599,
  httpsAgent: new Agent({ rejectUnauthorized: false })
});

export const req = {
  handleResponse(resp?, err?) {
    if(err) {
      return { error: {status: 'general error', message: err } };
    } else if(resp.status >= 200 && resp.status <= 204)
      return resp.data;
    else if(resp.status >= 400 && resp.status <= 599) {
      if(resp.status === 599) console.log(resp.data);
      return {
        error: { status: resp.status, message: resp.statusText }
      };
    }
  },
  get(options: any) {
    return request(options);
  },
  post(options: any) {
    options['method'] = 'post';
    return request(options)
      .then(this.handleResponse)
      .catch(err => this.handleResponse(null, err));
  }
};