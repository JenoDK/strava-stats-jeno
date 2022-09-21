import axios, { AxiosStatic } from 'axios';
import { setupCache, type AxiosCacheInstance } from 'axios-cache-interceptor/dev';

setupCache(axios, {
    ttl: 15 * 60 * 1000,
    debug: console.log
});

export default axios as AxiosCacheInstance & AxiosStatic;