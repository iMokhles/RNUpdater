# Version Selector - MVVM Architecture

This directory contains the refactored Version Selector component following the MVVM (Model-View-ViewModel) pattern for better separation of concerns and maintainability.

## Architecture Overview

### 📁 File Structure

```
version-selector/
├── index.ts                           # Public exports
├── version-selector.tsx               # Main View component
├── version-selector.viewmodel.ts      # ViewModel (business logic)
├── version-list.tsx                   # Version list sub-component
├── version-item.tsx                   # Individual version item
├── version-actions.tsx                # Action buttons (upgrade, view diff)
├── version-empty.tsx                  # Empty state component
├── version-error.tsx                  # Error display component
└── README.md                          # This documentation
```

## Components

### 🎯 Main Component

- **`VersionSelector`** - Main container component that orchestrates all sub-components

### 🧩 Sub-Components

- **`VersionList`** - Displays the list of available React Native versions
- **`VersionItem`** - Individual version item with selection state and badges
- **`VersionActions`** - Action buttons for selected version (upgrade, view diff)
- **`VersionEmpty`** - Empty state when no versions are available
- **`VersionError`** - Error display with dismiss functionality

### 🧠 ViewModel

- **`useVersionSelectorViewModel`** - Custom hook containing all business logic
- **`VersionSelectorViewModel`** - TypeScript interface defining the ViewModel contract

## MVVM Pattern Benefits

### ✅ Separation of Concerns

- **View**: Pure presentation components with no business logic
- **ViewModel**: Contains all business logic and state management
- **Model**: External data sources (stores, services)

### ✅ Testability

- ViewModel can be tested independently
- Sub-components can be tested in isolation
- Business logic is separated from UI logic

### ✅ Reusability

- Sub-components can be reused in other contexts
- ViewModel logic can be shared across different views
- Clear interfaces make components easy to understand

### ✅ Maintainability

- Changes to business logic only affect the ViewModel
- UI changes only affect the View components
- Clear boundaries between different concerns

## Usage Example

```tsx
import { VersionSelector } from "./version-selector";

function MyComponent() {
  const handleUpgrade = (version: string) => {
    console.log("Upgrading to:", version);
  };

  return (
    <VersionSelector
      releases={releases}
      currentVersion="0.72.0"
      onVersionSelect={(version) => console.log("Selected:", version)}
      onUpgrade={handleUpgrade}
    />
  );
}
```

## ViewModel Interface

```typescript
interface VersionSelectorViewModel {
  // State
  selectedVersion: string | null;
  showDiff: boolean;
  error: string | null;
  selectedDiff: any;
  isDiffLoading: boolean;

  // Actions
  selectVersion: (version: string) => void;
  showVersionDiff: () => Promise<void>;
  clearSelection: () => void;
  clearError: () => void;
}
```

## Key Features

- 🎨 **Responsive Design**: Works on all screen sizes
- 🎯 **Type Safety**: Full TypeScript support
- 🔄 **State Management**: Centralized state in ViewModel
- 🧪 **Testable**: Easy to unit test each component
- ♿ **Accessible**: Proper ARIA labels and keyboard navigation
- 🎭 **Theme Support**: Works with light/dark themes
- 📱 **Mobile Friendly**: Touch-friendly interface

## Future Enhancements

- [ ] Add keyboard navigation
- [ ] Implement version filtering
- [ ] Add version comparison
- [ ] Add upgrade progress tracking
- [ ] Add version release notes
- [ ] Add version download statistics
