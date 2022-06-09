import axios from 'axios';
import { BACKEND_SERVER_BASE_URL } from '../constants/constants';

const instance = axios.create({
  baseURL: BACKEND_SERVER_BASE_URL,
});

export default instance;
