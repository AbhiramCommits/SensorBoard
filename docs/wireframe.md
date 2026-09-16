# Wireframes

This document is the **build contract** for the UI. Later prompts that implement
components MUST match these wireframes.

Conventions:

- `[...]` = text input, `[...v]` = select, `[  ]` = button
- `====` = header bar, `----` = card/table border
- `XXX` = content placeholder
- `#` = pagination controls

---

## 1. Sensor List

```
+==============================================================================+
| SensorBoard                                                    [logo]       |
+==============================================================================+
| Filters                                                                      |
| [ Search................ ]  Type [All types....v]  Status [All statuses.v]   |
| From [2026-01-01]  To [2026-02-01]                              [  Reset  ] |
+------------------------------------------------------------------------------+
| Name            | Type        | Status   | Last Reading | Updated At         |
|-----------------|-------------|----------|--------------|--------------------|
| Hallway-01      | temperature | online   | 21.4 °C      | 2026-02-01 09:41Z  |
| Pump-Bearing    | vibration   | degraded | 0.82 mm/s    | 2026-02-01 09:40Z  |
| Roof-RH         | humidity    | offline  | --           | 2026-01-28 18:02Z  |
| ...             | ...         | ...      | ...          | ...                |
+------------------------------------------------------------------------------+
| Showing 1-3 of 3            Page size [10 v]     < Prev  1 2 3  Next >       |
+==============================================================================+
```

## 2. Sensor Detail

```
+==============================================================================+
| SensorBoard                                                    [logo]       |
+==============================================================================+
| Sensors > Hallway-01                                         (breadcrumb)   |
+------------------------------------------------------------------------------+
| Metadata                                      | Readings over date range     |
|  ID:      sens_01                            |                               |
|  Type:    temperature                        |        ___                    |
|  Location: Building A, Hallway 1            |    ___/   \___    [select v]  |
|  Unit:    °C                                |   /           \__/  range     |
|  Status:  online  ●                         |  /                            |
|----------------------------------------------|-------------------------------|
| Recent Readings                                                             |
| Recorded At          | Value                                                |
|----------------------|------------------------------------------------------|
| 2026-02-01 09:41:02Z | 21.4 °C                                              |
| 2026-02-01 09:40:02Z | 21.3 °C                                              |
| ...                  | ...                                                  |
+==============================================================================+
```

## 3. Shared States

```
Loading skeleton:
+--------------------------------------+
| ################  ################   |  <- shimmering gray blocks
| ######  #####  ####  ######  ####    |
+--------------------------------------+

Error banner with retry:
+--------------------------------------+
| !! Failed to load sensors            |
|    Network error                      |
|                        [ Retry ]     |
+--------------------------------------+

Empty state:
+--------------------------------------+
|              ( o )                   |
|         No sensors found             |
|    Try adjusting your filters.       |
|              [ Reset ]               |
+--------------------------------------+
```
