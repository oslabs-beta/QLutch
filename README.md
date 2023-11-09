# QLutch

%%Logo%%

<a href="https://github.com/oslabs-beta/rediQLess/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/oslabs-beta/rediQLess"></a>
<a href="https://github.com/oslabs-beta/rediQLess/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/oslabs-beta/rediQLess"></a>

A caching solution for graphQL APIs that interfaces with Redis for high-speed data retrieval, combined with performance visualization.

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)
![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
____
# Features
- Redis cache integration for graphQL queries and *Create* mutations.
- Performance monitor.

![[QLutch Data Flow (1).png]]
![[Pasted image 20231106221347.png]]

%%Demo Gif%%
![[Pasted image 20231106221334.png]]

# Usage Notes
- Caching support for Update and Delete mutations is not yet implemented.

# Roadmap

# Installation
- User creates application and installs Qlutch dependency via npm
- Set up Redis database in application
- Require Qlutch and Redis in server file
- Need two endpoints – one for qlutch and one for gql
- Install qlutch as middleware in /qlutch – pass in “actualGraphql” endpoint and redis
- User would need to return res.locals.response in /qlutch endpoint
- Fetch requests on frontend will need to be made to /qlutch

# Authors
- [@Michael-Weckop](https://github.com/Michael-Weckop)
- [@lrod8](https://github.com/lrod8)
- [@alroro](https://github.com/alroro)
- [@Reneeto](https://github.com/Reneeto)
# Acknowledgements
- [Charlie Charboneau](https://github.com/CharlieCharboneau)
- [Annie Blazejack](https://github.com/annieblazejack)
- [Matt Severyn](https://github.com/mtseveryn)
- [Erika Collins Reynolds](https://github.com/erikacollinsreynolds)
- [Sam Arnold](https://github.com/sam-a723)
