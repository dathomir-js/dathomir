---
name: spec-implementation-review
description: Reviews and validates consistency between SPEC.typ files and their corresponding implementation.ts files in a package directory. Detects design-implementation gaps, suggests fixes, and adds missing test cases. Useful when user says "review SPEC and implementation for gaps" or "#file:directory の設計と実装の乖離をレビューして" or similar phrasing about checking specification-implementation alignment.
---

# SPEC/Implementation Consistency Review Skill

## Purpose

This skill systematically reviews package directories to ensure that SPEC.typ (specification/design documents) and implementation.ts files are aligned. It detects discrepancies between design intent and actual code, identifies missing features, and validates test coverage.

## When to Use

Activate this skill when the user requests:
- `#file:ディレクトリ の設計と実装の乖離をレビューして`
- "Review SPEC and implementation for gaps in [package/directory]"
- "Validate specification against implementation"
- "Check if code matches design documents"
- "Find discrepancies between SPEC.typ and implementation"

## Workflow

### Step 1: Extract SPEC.typ Files

1. Navigate to the specified package directory (e.g., `packages/components/`, `packages/runtime/`, etc.)
2. Use `file_search` or `grep_search` to find all SPEC.typ files:
   ```
   file_search: **/SPEC.typ
   ```
3. List all found SPEC.typ files with their full paths
4. Report count: "Found X SPEC.typ files in [package]"

### Step 2: Read Specification and Implementation

For each SPEC.typ file:

1. Read the SPEC.typ file completely to understand:
   - Purpose and objectives
   - Function signatures
   - Expected behavior
   - Edge cases
   - Design decisions (ADR sections)
   - Test case requirements

2. Locate the corresponding implementation.ts file (same directory)

3. Read the implementation.ts file completely to understand:
   - Actual function signatures
   - Implementation details
   - Exported functions
   - Code patterns used

### Step 3: Validate with Subagent

Launch a subagent for EACH SPEC.typ to perform detailed validation:

```typescript
runSubagent({
  description: "[feature-name] SPEC検証",
  prompt: `
以下のSPEC.typとimplementation.tsを比較し、実装と仕様・設計の間に乖離がないか精査してください。

# SPEC.typ ([feature-name])
[仕様の主要ポイントを箇条書き]
- 目的: ...
- 提供する関数: ...
- 期待される動作: ...
- エッジケース: ...
- ADR: ...

# implementation.ts (/path/to/implementation.ts)
[実装の特徴を箇条書き]
- 実装されている関数: ...
- 動作の詳細: ...
- 特記事項: ...

## 検証項目
1. 関数シグネチャは一致しているか
2. 動作の説明と実装は一致しているか
3. エッジケースは適切に処理されているか
4. ADRの設計決定は実装に反映されているか
5. 重大な乖離（実装バグや設計矛盾）があるか
6. テストケースは十分か

実装がSPEC.typの記述と一致しているか、一致していない点があれば具体的に指摘してください。
  `
})
```

**Important**: Run subagents in PARALLEL for efficiency when checking multiple SPEC files (3-4 at a time recommended).

### Step 4: Analyze Results

Categorize findings into:

1. **Critical Issues** (実装バグ):
   - Function not implemented as specified
   - Missing required functionality
   - Incorrect behavior
   - Type safety violations

2. **Documentation Gaps** (SPEC古い):
   - Implementation evolved but SPEC not updated
   - Missing ADRs for design decisions
   - Undocumented features in implementation

3. **Test Coverage Gaps**:
   - Missing test cases listed in SPEC.typ
   - Edge cases not tested

### Step 5: Fix Issues

Based on findings:

#### For Implementation Bugs:

1. **MUST** create/update SPEC.typ FIRST if needed
2. **MUST** create/update implementation.test.ts with failing tests
3. Fix implementation.ts
4. Run tests to verify:
   ```bash
   cd [package-directory] && pnpm test
   ```

#### For Documentation Gaps:

1. Update SPEC.typ to reflect actual implementation
2. Add ADR sections explaining design decisions
3. Update test case requirements in SPEC

#### For Test Coverage Gaps:

1. Read implementation.test.ts
2. Add missing test cases from SPEC.typ
3. Run tests to verify all pass

### Step 6: Report Results

Create a structured summary:

```markdown
## [Package Name] Validation Complete

### SPEC Files Reviewed: X

- ✅ [feature-1/SPEC.typ](path)
- ⚠️ [feature-2/SPEC.typ](path)
- ❌ [feature-3/SPEC.typ](path)

### Issues Found

#### Critical Issues: X
1. [Description] - [File:Line]
   - **Fix**: [What was done]

#### Documentation Updates: X
1. [Description] - [File]
   - **Update**: [What was updated]

#### Test Cases Added: X
1. [Test description]
   - [File:Line]

### Test Results
✅ All tests passing: X/X
```

## Important Rules

### MUST DO:
- ✅ Read both SPEC.typ AND implementation.ts COMPLETELY before validation
- ✅ Use subagent for each SPEC validation (don't do manual comparison)
- ✅ Run subagents in PARALLEL when possible (3-4 at a time)
- ✅ Update SPEC.typ BEFORE fixing implementation.ts
- ✅ Create test cases BEFORE implementing fixes
- ✅ Run tests after each fix to verify

### MUST NOT DO:
- ❌ Skip reading SPEC.typ or implementation.ts
- ❌ Make assumptions about implementation without reading code
- ❌ Fix implementation without updating tests first
- ❌ Modify code without running tests afterward
- ❌ Report completion without test verification

## Examples

### Example 1: Package Review

**User Request:**
```
#file:components の設計と実装の乖離をレビューして
```

**Agent Actions:**
1. Extract: Find 4 SPEC.typ files in packages/components/
2. Read: All SPEC.typ and implementation.ts pairs
3. Validate: Run 4 subagents in parallel
4. Results: Found 1 implementation bug in defineComponent
5. Fix: Update test → Fix implementation → Verify tests pass
6. Report: Summary with links to fixes

### Example 2: Runtime Package Review

**User Request:**
```
Review SPEC and implementation for gaps in runtime package
```

**Agent Actions:**
1. Extract: Find 14 SPEC.typ files in packages/runtime/
2. Read: All pairs of files
3. Validate: Run 14 subagents in 4 parallel batches (4+4+4+2)
4. Results: Found 6 documentation gaps (SPEC outdated)
5. Fix: Update 6 SPEC.typ files with 16 new ADRs
6. Report: Summary showing no implementation bugs, only doc updates

## Common Patterns

### Pattern: Implementation evolved faster than SPEC
**Symptom:** Subagent reports features in code not in SPEC
**Action:** Update SPEC.typ to match implementation, add ADRs

### Pattern: SPEC describes unimplemented features
**Symptom:** Subagent reports functions in SPEC missing in code
**Action:** Either implement feature or remove from SPEC (ask user)

### Pattern: Test cases missing
**Symptom:** SPEC lists test cases not in implementation.test.ts
**Action:** Add missing test cases, run tests

### Pattern: Type safety issues
**Symptom:** Subagent reports type mismatches
**Action:** Fix types in implementation.ts, verify with TypeScript

## Validation Checklist

Before reporting completion, verify:

- [ ] All SPEC.typ files found and processed
- [ ] All subagents completed (no skipped files)
- [ ] All critical issues fixed and tested
- [ ] All test files updated where needed
- [ ] `pnpm test` passes for affected packages
- [ ] Documentation updated (SPEC.typ or AGENTS.md)
- [ ] Changes tracked with todo list (manage_todo_list)

## Dependencies

This skill requires:
- Package structure: `packages/*/src/**/SPEC.typ`
- Test structure: `packages/*/src/**/implementation.test.ts`
- Build tool: `pnpm` for running tests
- Availability of subagent execution

## Related Files

- `AGENTS.md` - Project-level development guidelines
- `#SPEC/SPEC.typ` - Root specification document
- Each package's `AGENTS.md` - Package-specific guidelines
