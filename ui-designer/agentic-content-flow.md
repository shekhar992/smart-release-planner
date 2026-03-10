# Conversational Asset Creation
## Functional User Journey

### Purpose

This document describes the functional flow of how a content admin creates a marketing or medical asset using a conversational AI assistant.

The focus is on **user actions, system responses, and expected outputs** rather than technical architecture.

---

# User Persona

Content Admin

Responsibilities:

- Create promotional or educational assets
- Follow brand guidelines
- Ensure content is compliant before submission to MLR
- Manage assets across multiple brands and markets

---

# Entry Point

User logs into the platform and lands on the **Dashboard**.

The dashboard contains a conversational assistant that allows the user to create or manage content.

User sees a prompt:

"Ask AI to create or manage your content."

---

# Step 1 – User Initiates Content Creation

### User Action

User enters a prompt into the dashboard assistant.

Example prompt:

Create an RTE educational asset for Brand X targeting oncologists in Germany based on the latest clinical trial data.

---

### System Response

The system interprets the request and extracts key parameters.

The assistant confirms the details with the user.

Example response:

I can help create this asset.

Please confirm the following details:

Brand: Brand X  
Channel: RTE Educational  
Audience: Oncologists  
Market: Germany  
Language: German  

Would you like to proceed?

---

### Expected User Action

User confirms or edits parameters.

Example:

Proceed.

---

# Step 2 – Content Generation Begins

### System Action

The platform gathers necessary information to generate the asset.

This includes:

- Brand guidelines
- Approved claims
- Clinical evidence
- Market requirements

---

### System Output

The system generates a draft asset.

The user is taken to the **Content Editing Workspace**.

---

# Step 3 – Content Editing Workspace

The workspace is divided into two panels.

Left Panel:

Editable content canvas.

Right Panel:

Conversational assistant.

---

### Example Generated Asset

Headline  
Key Scientific Message  
Supporting Evidence  
Safety Information  
Call to Action  
References

---

# Step 4 – Conversational Editing

### User Action

User edits content using the chat assistant.

Examples:

Make the headline more engaging.

Add a short safety summary.

Update the layout according to the brand color palette.

---

### System Response

The system updates the asset in real time.

Changes are reflected in the editable content canvas.

---

# Step 5 – Content Review

Once the user is satisfied with the content, the system performs an automated review.

---

### System Checks

The system verifies:

- Claims are supported by evidence
- Safety information is present
- Language is clear and compliant
- References are included

---

### System Output

Example feedback:

Content review completed.

Compliance score: 92%

Suggestions:
Add citation to claim regarding progression-free survival.
Clarify safety statement.

---

### User Action

User applies suggested improvements or proceeds.

---

# Step 6 – Save Asset

### User Action

User saves the content.

---

### System Action

The asset is stored in the **Content Library**.

---

### Stored Metadata

Brand  
Market  
Channel  
Language  
Claims used  
Source documents  
Version history  

---

# Step 7 – Localization (Optional)

The user may want to adapt the asset for another market.

---

### User Action

User enters a request in the assistant.

Example:

Localize this asset for Spain.

---

### System Response

The platform generates a localized version of the content.

Adjustments include:

Translation  
Regional terminology  
Local regulatory language  

---

### Output

A new asset version is created for the selected market.

---

# Final Result

The user successfully creates a compliant content asset using a conversational workflow.

The asset is stored in the content library and can be:

- Reused
- Localized
- Submitted for MLR review
- Distributed through marketing channels

---

# Visual Flow Representation

```mermaid
flowchart TD

A[User Opens Dashboard]

B[User Requests New Asset]

C[System Confirms Brand and Channel]

D[System Generates Initial Content]

E[Content Editing Workspace]

F[User Edits Content via Chat]

G[Automated Content Review]

H[User Saves Asset]

I[Content Stored in Library]

J[Optional Localization]

A --> B
B --> C
C --> D
D --> E
E --> F
F --> G
G --> H
H --> I
I --> J