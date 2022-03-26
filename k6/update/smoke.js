// smoke.js
import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';

export let options = {
  vus: 1, // 1 user looping for 1 minute
  duration: '10s',

  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

const BASE_URL = 'https://yunha-infra-subway.o-r.kr';
const USERNAME = 'test@example.com';
const PASSWORD = 'nextstep!1';

export default function ()  {

  const before = new Date().getTime();
  const T = 2;

  var payload = JSON.stringify({
    email: USERNAME,
    password: PASSWORD,
  });

  var params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let loginRes = http.post(`${BASE_URL}/login/token`, payload, params);
  check(loginRes, {'logged in successfully': (resp) => resp.json('accessToken') !== '',});


  let authHeaders = {
    headers: {
        Authorization: `Bearer ${loginRes.json('accessToken')}`,
        'Content-Type': 'application/json',
    },  
  };

  var updatePayload = JSON.stringify({
    email: USERNAME,
    password: PASSWORD,
    age: 30
  });

  let updateRes = http.put(`${BASE_URL}/members/me`, updatePayload, authHeaders);
  check(updateRes, { 'updated member successfully': (resp) => resp.status === 200 });
  
  let myObjects = http.get(`${BASE_URL}/members/me`, authHeaders).json();
  check(myObjects, { 'retrieved member': (obj) => obj.id != 0 });

  const after = new Date().getTime();
  const diff = (after - before) / 1000;
  const remainder = T - diff;
  check(remainder, { 'reached request rate': remainder > 0 });
  if (remainder > 0) {
    sleep(remainder);
  } else {
    console.warn(`Timer exhausted! The execution time of the test took longer than ${T} seconds`);
  }
};