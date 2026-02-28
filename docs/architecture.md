
```mermaid
flowchart LR
  linkStyle default stroke:#ffffff,stroke-width:2px
  Client --> API[Express API]
  API --> Mongo[(MongoDB)]
  API --> Cache[(Redis Cache)]
  API --> Q[BullMQ Queues]

  Q --> W1[Analytics Worker]
  Q --> W2[Media Worker]
  Q --> W3[Email Worker]
  Q --> W4[Notifications Worker]

  Redis[(Redis/BullMQ Backend)] <--> Q
  Redis <--> W1
  Redis <--> W2
  Redis <--> W3
  Redis <--> W4

  W1 --> Mongo
  W2 --> Cloudinary
  W2 --> Mongo
  W3 --> MailProvider[Email Provider]
  W4 --> Mongo
  ```