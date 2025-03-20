// jest.setup.env.js
import dotenv from 'dotenv';
import { Request, Response, Headers, default as fetch } from 'node-fetch';

dotenv.config({ path: '.env.test' });

global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;