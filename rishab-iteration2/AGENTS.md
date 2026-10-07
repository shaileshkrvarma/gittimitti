AGENTS.md
Coding AI Assistant Instructions
1. Project Context
This project is a Real Estate E-commerce Marketplace.
The current functional requirements are documented in:
requirements.md
This project is currently in Iteration 1 / Draft.
The requirements may change as the client provides additional clarification.
2. Source of Truth
requirements.md is the source of truth for the currently approved business requirements.
The coding AI assistant must:
- Read requirements.md before implementing a new feature.
- Implement only requirements that are currently approved.
- Avoid inventing business rules.
- Avoid adding features simply because they are common in e-commerce applications.
- Treat unclear business requirements as questions that need clarification.
If a feature is technically necessary but is not a business requirement, clearly identify it as an implementation decision/dependency rather than silently adding it to the product scope.
3. Development Approach
Work incrementally.
For every development task:
1. Understand the relevant requirement.
2. Inspect the existing code before making changes.
3. Identify the affected components/modules.
4. Implement the smallest appropriate change.
5. Add or update tests.
6. Run the relevant tests/build.
7. Review for regressions.
8. Report what was changed and any unresolved questions.
Do not make large unrelated refactoring changes while implementing a feature.
4. Requirements Discipline
Do not add new business requirements without approval.
For example, do not independently introduce:
- New user roles.
- New payment rules.
- Commission rules.
- Supplier settlement rules.
- Refund policies.
- Tax rules.
- Delivery rules.
- Property-specific workflows.
- AI capabilities.
unless they are explicitly added to requirements.md.
If implementation requires one of these decisions, stop and ask for clarification.
5. Multi-Supplier Marketplace
The system must support users purchasing products from multiple suppliers.
Keep supplier-related functionality sufficiently separated so that supplier information can be maintained independently.
Do not assume business rules for:
- Supplier commission.
- Supplier payout.
- Supplier settlement.
- Supplier refund responsibility.
- Supplier taxation.
- Supplier delivery responsibility.
unless these rules are explicitly defined in requirements.md.
6. Application Structure
Keep responsibilities separated appropriately.
Business logic should not be unnecessarily coupled to:
- Controllers/API endpoints.
- Database access.
- Payment providers.
- Email providers.
- SMS providers.
- WhatsApp providers.
- AI services.
External services should be accessed through clear interfaces/adapters where appropriate.
Do not introduce unnecessary architectural complexity.
Use the project's existing architecture and technology choices unless a change is explicitly requested or technically justified.
7. User and Authentication
The application includes:
- User registration.
- User login.
- User dashboard.
Authentication and authorization must be implemented securely.
Never:
- Hard-code passwords.
- Hard-code authentication secrets.
- Store secrets in source control.
- Expose credentials through APIs or logs.
Validate user input and protect authenticated resources.
8. Admin Functionality
The application includes an Admin dashboard with management capabilities defined in requirements.md.
Admin-only functionality must be protected by appropriate authorization.
Do not assume additional admin capabilities unless they are approved requirements.
9. Product, Supplier and Category Management
Product, supplier, and category functionality should be implemented according to the approved requirements.
Avoid duplicating business logic across modules.
Before creating a new entity, service, controller, or database table:
- Check whether an equivalent already exists.
- Reuse existing components when appropriate.
- Avoid duplicate models.
10. Payment Integration
The application requires payment gateway integration.
Treat the payment gateway as an external system.
Payment status must not be trusted solely from client-side information.
Do not store sensitive payment credentials or card information unless explicitly required and handled according to the payment provider's requirements.
Keep payment-provider-specific code isolated from core business logic where practical.
Do not invent:
- Commission calculations.
- Settlement schedules.
- Refund policies.
- Tax calculations.
unless they are approved requirements.
11. Order Management
The application requires order management.
Orders involving multiple suppliers must be handled in a way that preserves the relationship between the customer, order, products, and suppliers.
However, do not invent supplier-specific order, fulfillment, refund, or settlement rules unless they are defined by the client.
12. Notifications
The application requires notifications through:
- WhatsApp.
- Email.
- SMS.
Notification providers should be isolated from core business logic.
A temporary failure of an external notification service should not unnecessarily corrupt the underlying business transaction.
Do not assume a specific WhatsApp, email, or SMS provider unless one is explicitly selected.
13. WhatsApp AI Assistant
The application requires an AI assistant chatbot through WhatsApp.
Keep AI functionality isolated from the core application.
The AI assistant must:
- Use reliable application data when answering questions that depend on current system information.
- Avoid inventing product, supplier, order, payment, or other business information.
- Respect authentication and authorization requirements.
- Avoid performing unapproved business actions.
Do not add autonomous AI capabilities that are not explicitly approved.
14. Database Changes
Before modifying the database:
1. Inspect the existing schema/model.
2. Check for existing entities and relationships.
3. Avoid duplicate fields/entities.
4. Use the project's migration mechanism where applicable.
5. Consider backward compatibility.
Database changes should be directly related to an approved requirement or a clearly documented technical dependency.
15. API Development
APIs should:
- Use clear and consistent naming.
- Validate incoming data.
- Return appropriate HTTP status codes.
- Use consistent error handling.
- Avoid exposing internal implementation details.
- Enforce authentication and authorization where required.
Do not expose sensitive information in API responses.
16. Security
Follow secure coding practices throughout the project.
At minimum:
- Validate input.
- Sanitize data where appropriate.
- Protect authenticated endpoints.
- Enforce authorization.
- Protect secrets.
- Avoid sensitive information in logs.
- Use secure password handling.
- Protect external integration credentials.
Security should not be bypassed simply to make development or testing easier.
17. Testing
Every implemented feature should have appropriate tests.
Where applicable, test:
- Successful operations.
- Validation failures.
- Authentication failures.
- Authorization failures.
- Important error conditions.
- External integration failures.
Do not remove or weaken existing tests merely to make the build pass.
18. Error Handling and Logging
Use consistent error handling.
Errors should:
- Be meaningful to developers.
- Avoid exposing sensitive internal information to users.
- Be logged appropriately.
- Include enough context for troubleshooting without logging secrets.
External-service failures should be handled gracefully.
19. Code Quality
Write code that is:
- Readable.
- Maintainable.
- Testable.
- Consistent with the existing project conventions.
Prefer simple solutions over unnecessary abstraction.
Do not introduce frameworks, libraries, services, or infrastructure without a clear reason.
Reuse existing project dependencies when possible.
20. Change Management
When a business requirement changes:
1. Update requirements.md.
2. Identify affected functionality.
3. Update the implementation.
4. Update tests.
5. Update relevant documentation.
Do not modify requirements.md simply to justify an implementation choice.
21. Definition of Done
A feature is considered complete when:
- It maps to an approved requirement.
- The implementation is complete.
- Appropriate validation and error handling are present.
- Appropriate tests are added or updated.
- Existing functionality continues to work.
- No secrets are introduced.
- Relevant documentation is updated.
22. Important Instruction
Do not guess business requirements.
If the client requirement is ambiguous, ask for clarification.
The goal of Iteration 1 is to build a clean, maintainable foundation based on the requirements that have actually been approved.