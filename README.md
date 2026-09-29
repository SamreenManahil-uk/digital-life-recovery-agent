# digital-life-recovery-agent
Full-stack AI recovery platform built with Python, FastAPI, PostgreSQL, React &amp; TypeScript, featuring graph algorithms, cascading impact analysis and risk modelling.
# Digital Life Recovery & Dependency Agent

An AI-powered digital dependency analysis and recovery platform designed to help users understand how their important digital services depend on one another and what may be affected when access to a device, account, email address, phone number, or authentication method is lost.

## Overview

Modern digital identities are highly interconnected. A phone number may provide two-factor authentication for an email account, that email may provide access to GitHub, and GitHub may control deployments to production applications.

A failure at one point can therefore create cascading effects across multiple services.

Digital Life Recovery & Dependency Agent models these relationships as a dependency network and helps users identify:

- Direct and indirect dependencies
- Cascading incident impact
- Critical digital services
- Single points of failure
- Recovery weaknesses
- Dependency depth
- Recovery readiness
- Prioritized recovery actions

## Example

```text
Phone
  ↓
Primary Gmail
  ↓
GitHub
  ↓
Vercel
  ↓
Production Website
```

If the phone becomes unavailable, the platform can analyse which downstream services may also be affected and determine the depth and severity of the impact.

## Core Architecture

The platform separates deterministic analysis from AI-assisted explanation.

```text
React + TypeScript Frontend
            ↓
       FastAPI API
            ↓
 ┌──────────┼──────────┐
 ↓          ↓          ↓
Dependency  Risk     Incident
 Engine    Engine     Engine
 └──────────┼──────────┘
            ↓
       PostgreSQL
            ↓
 Structured Results
            ↓
   AI Recovery Agent
```

The deterministic engine is responsible for dependency traversal, impact propagation, risk calculations and recovery analysis.

The AI layer is used for explanation, summarization and organizing recovery guidance rather than calculating system truth.

## Planned Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Flow

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

### Database

- PostgreSQL
- Recursive CTEs
- Foreign keys
- Constraints
- Indexes
- Transactions
- Optimized relational queries

### Engineering

- REST APIs
- Graph traversal
- Dependency analysis
- Cycle detection
- Cascading impact analysis
- Single-point-of-failure detection
- Deterministic risk modelling
- Recovery prioritization

### Security

- Authentication and authorization
- Secure password hashing
- Input validation
- Audit logging
- Rate limiting
- Secure headers
- Environment-based secrets
- Privacy-by-design

### Testing

- Unit tests
- API tests
- Integration tests
- Dependency-engine tests
- Risk-engine tests
- Incident-propagation tests

## Privacy & Security Principles

This project is **not a password manager**.

The application will not store:

- External account passwords
- Authentication tokens
- Recovery codes
- Private keys
- Authenticator secrets

Only the metadata required to model digital dependencies and recovery mechanisms will be stored.

## Project Status

🚧 **Currently under active development**

The project is being built incrementally with an emphasis on software architecture, security, testing, advanced PostgreSQL usage and explainable dependency analysis.

## Planned Features

- User authentication
- Digital service management
- Recovery method management
- Dependency relationship modelling
- Interactive dependency graph
- Recursive dependency analysis
- Incident reporting
- Cascading impact analysis
- Risk scoring
- Single-point-of-failure detection
- Recovery readiness assessment
- AI-assisted recovery planning
- Audit history
- CI/CD
- Cloud deployment

## Portfolio Focus

This project demonstrates practical experience with:

**Full-Stack Engineering · Python · FastAPI · PostgreSQL · Advanced SQL · React · TypeScript · REST APIs · Graph Algorithms · Secure Software Design · AI Integration · Testing · CI/CD · System Design**

---

> This project is designed for dependency analysis and recovery planning. It does not store third-party account credentials or authentication secrets.
