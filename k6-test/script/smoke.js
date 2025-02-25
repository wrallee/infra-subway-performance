import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';

export let options = {
    vus: 1, // 1 user looping for 1 minute
    duration: '10s',

    thresholds: {
        http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    },
};

let loginTrend = new Trend('DURATION TIME - logged in successfully', true);
let myInfoTrend = new Trend('DURATION TIME - retrieved member', true);

const BASE_URL = 'https://xn--vo5bi4h.xn--yq5b.xn--3e0b707e';
const USERNAME = 'abc@gmail.com';
const PASSWORD = '123456';

export default function ()  {

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
    loginTrend.add(loginRes.timings.duration);

    check(loginRes, {
        'logged in successfully': (resp) => resp.json('accessToken') !== '',
    });


    let authHeaders = {
        headers: {
            Authorization: `Bearer ${loginRes.json('accessToken')}`,
        },
    };

    let myInfoRes = http.get(`${BASE_URL}/members/me`, authHeaders);
    myInfoTrend.add(myInfoRes.timings.duration);

    let myObjects = myInfoRes.json();
    check(myObjects, {
        'retrieved member': (obj) => obj.id != 0
    });

    sleep(1);
}
