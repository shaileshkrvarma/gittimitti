ECH_STACK.md
Real Estate E-commerce Marketplace
Simple Prototype / Iteration 1
Goal
Build a simple, low-cost prototype for the Indian market.
The first version should focus on:
- Simple development
- Low hosting cost
- Easy maintenance
- Web + Android support
- Future AI capability
Technology Stack
Web
- React
- TypeScript
- Vite
- MUI or Bootstrap
Android
- React Native
- Expo
- TypeScript
Backend
- Python
- FastAPI
- REST API
Database
- PostgreSQL
Authentication
- JWT
- FastAPI security
Hosting
- Railway
Initial deployment:
React Web
    |
    v
FastAPI
    |
    v
PostgreSQL
Android uses the same FastAPI backend.
AI
Use an external AI API initially.
Possible options:
- OpenAI
- Hugging Face
Do not host an AI model ourselves in the first version.
AI will be added after the core application is working.
Payments
Use an Indian payment gateway when real payment integration starts.
Possible providers:
- Razorpay
- Cashfree
- PayU
For the prototype, payment should remain mock/demo functionality.
Notifications
Future integrations:
- WhatsApp
- Email
- SMS
For the prototype, these should be mock/demo functionality.
Development Tools
- Visual Studio Code
- Git
- GitHub
- Postman
- Node.js
- Python
Cost Optimization
For Iteration 1:
- No microservices
- No Kubernetes
- No Kafka
- No Redis
- No Elasticsearch
- No load balancer
- No complex AWS infrastructure
- No self-hosted AI model
Keep the system as a simple application.
Target initial hosting cost:
Approximately ₹500–₹1,000/month, depending on actual Railway usage.
Third-party costs such as SMS, WhatsApp, AI and payment processing are separate.
Architecture
             React Web
                 |
          React Native
             Android
                 |
                 v
              FastAPI
                 |
                 v
            PostgreSQL
                 |
       -------------------
       |        |        |
    Payment  WhatsApp   AI
Use one backend and one database.
Do not create separate backends for Web and Android.
Future Scaling
Start simple.
If the application grows, components can be separated later:
Simple Application
       |
       v
Growing Application
       |
       +--> Managed Database
       +--> Object Storage
       +--> Multiple App Instances
       +--> AI Service
Do not build future infrastructure before it is needed.
Important Rule
This technology stack is for the initial version.
Choose the simplest technology that solves the current requirement.
Do not add a new technology unless there is a clear requirement or technical need.