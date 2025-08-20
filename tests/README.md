# CableForge Test Suite

## Test Structure

### Unit Tests (`tests/unit/`)
Test individual functions and components in isolation:
- **calculations/** - Engineering calculations (voltage drop, conduit fill)
- **database/** - Database operations and queries
- **validation/** - Data validation rules
- **components/** - React component testing

### Integration Tests (`tests/integration/`)
Test interactions between components:
- **file_operations/** - Project save/load, import/export
- **database_operations/** - Complex multi-table operations
- **state_management/** - Frontend state updates
- **api_communication/** - Frontend-backend communication

### End-to-End Tests (`tests/e2e/`)
Test complete user workflows:
- **project_workflows/** - Create, edit, save projects
- **data_entry/** - Add/edit cables, I/O, conduits
- **calculations/** - Real-time calculation updates
- **export_workflows/** - Generate Excel reports

## Test Strategy

### TDD Approach
1. **Write failing test** - Define expected behavior
2. **Write minimal code** - Make test pass
3. **Refactor** - Improve code quality
4. **Repeat** - Continue with next feature

### Test Categories

#### Critical Path Tests
- Project file save/load
- Cable CRUD operations
- Conduit fill calculations
- Excel export generation

#### Business Logic Tests
- Voltage drop calculations
- Segregation validation
- Auto-numbering logic
- Revision tracking

#### UI Tests
- Component rendering
- User interactions
- State management
- Form validation

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Data

Test files are located in `tests/fixtures/`:
- `sample_project.cfp` - Complete project for testing
- `cable_library.cfl` - Sample cable library
- `import_data.csv` - Sample CSV import data
- `export_templates/` - Sample export templates

## Coverage Requirements

- **Unit Tests:** 90%+ code coverage
- **Integration Tests:** All major workflows covered
- **E2E Tests:** Critical user paths tested
- **Performance Tests:** Large dataset handling verified