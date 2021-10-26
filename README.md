# FunkoPopStore

A fictional online store that sells FunkoPop products. I've decided to build this project to get a better understanding of many concepts that I wasn't familiar with, such as Testing, Social Authentication, CI/CD and Deployments. I've tried to follow along with best practices in terms of file structuring, script management, security, and worflows.

## Usage

**Add a development.json file in config at the root folder**

```
{
  "port": <PORT>,
  "database": {
    "user": "<USERNAME>",
    "password": "<PASSWORD>",
    "name": "<DB_NAME>",
    "url": "<DB_URL>"
  },
  "session": {
    "secret": "<YOUR_SECRET>",
    "maxAge": <MAX_AGE>
  },
  "jwt": {
    "secret": "<YOUR_SECRET>"
  },
  "google": {
    "clientId": "<YOUR_CLIENT_ID>",
    "clientSecret": "<YOUR_CLIENT_SECRET>"
  }
}
```

You will have to create a similar file for different environments (eg: test -> test.json, production -> production.json).

**Install dependencies**
```
npm install
```

**Run linter and fix any linting issues**

```
npm run lint
npm run lint:fix
```

**Run on localhost:5000**
```
npm run dev
```

**Run tests**
```
npm run test
```

**Code Coverage**
```
npm run test:coverage
```

## Project Status
This project is currently in development.

## License

This project is licensed under the MIT License
