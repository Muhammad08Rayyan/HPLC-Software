# HPLC Report & .LCM File Generation Software - Requirements

## Overview

Custom HPLC (High-Performance Liquid Chromatography) report generation software with .LCM file export capabilities for pharmaceutical, chemical, and research laboratories.

## Purpose

Automate and streamline the generation of custom HPLC reports and export .LCM files compatible with LabSolutions Software. Provides full administrative control over data fields including peaks, area, height, and concentration for regulatory-compliant reporting.

## Key Features

### 1. Custom HPLC Report Generation
- Generate PDF or Excel-based HPLC reports with configurable data fields
- Support for HPLC attributes:
  - Number of Peaks
  - Retention Time
  - Area
  - Height
  - Concentration
  - Detector Settings
  - System Suitability Parameters
- Auto-generation from input data or batch uploaded CSV/Excel files

### 2. Admin-Defined Report Configuration
- Admin Panel settings:
  - Default or range of Number of Peaks
  - Enable/Disable Area, Height, and Concentration
  - Customize field labels (e.g., "Concentration" as "Conc.")
- Dynamic report layout adjustment based on admin settings
- Settings saved per user or lab department

### 3. .LCM Extension File Generation
- Generate .LCM files compatible with Shimadzu LabSolutions
- File format includes:
  - Peak list
  - Chromatogram metadata
  - Sample ID and parameters
- System validates LCM file format for seamless LabSolutions import

### 4. Real-Time Preview & Report Simulation
- Simulate reports with sample values before final generation
- Live preview of:
  - Peak shapes
  - Tabular data
  - Summary statistics

### 5. Data Input Sources
- Manual Entry Form
- Excel/CSV Upload
- API Integration with existing LIMS or HPLC software (optional)

### 6. User Roles & Permissions

| Role | Access Rights |
|------|---------------|
| Admin | Full control of settings, report templates, .LCM config |
| Analyst | Input data, generate reports, export .LCM |
| Viewer | Read-only access to reports and logs |

### 7. Audit Trail & Report History
- Log of all generated reports
- Track Date, Time, Analyst Name, Sample ID
- Option to restore previous configurations

## System Architecture

| Layer | Technology |
|-------|------------|
| Frontend | NextJS |
| Backend | NextJS API |
| Database | MongoDB |
| File Generation | Python scripts (PDF, .LCM) |
| Deployment | Vercel |

### Database Connection
```
mongodb+srv://kashiffareed2023_db_user:DMVRAAD9Z8avhKbn@main.82yfwpj.mongodb.net/
```

## Workflow

1. **Admin Configures Fields**
   - Define which data points (peak, area, height, concentration) to include

2. **Analyst Inputs Raw Data**
   - Manual entry or file upload

3. **System Generates Report**
   - Based on selected configuration

4. **System Exports .LCM File**
   - Validated and structured for LabSolutions software

5. **Report & File Archived**
   - Stored with timestamp and user details for future access

## Compatibility and Compliance

- **LCM File Standard**: Fully validated for LabSolutions (Shimadzu) software
- **21 CFR Part 11 Compliance Ready** (if required)
- **Data Integrity**: All changes and generations logged

## Technical Requirements

- NextJS for full-stack development
- MongoDB for data persistence
- Python integration for file generation
- Vercel deployment platform
- LabSolutions compatibility for .LCM files