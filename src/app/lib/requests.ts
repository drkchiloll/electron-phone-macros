import axios from 'axios';

export const req = (() => {
  const serv = {
    get(options: any) {
      axios.defaults.validateStatus = status =>
        status >= 200 && status <= 505;
      return axios(options);
    }
  };
  return serv;
})()