use super::{Database, models::*};
use rusqlite::{params, Result};
use chrono::Utc;

impl Database {
    // Project operations
    pub fn create_default_project(&self) -> Result<Project> {
        let now = Utc::now();
        let project = Project {
            id: None,
            name: "New CableForge Project".to_string(),
            description: Some("Created with CableForge".to_string()),
            client: None,
            engineer: None,
            major_revision: "Draft".to_string(),
            minor_revision: 0,
            created_at: now,
            updated_at: now,
        };

        self.insert_project(&project)
    }

    pub fn insert_project(&self, project: &Project) -> Result<Project> {
        let mut stmt = self.connection.prepare(
            "INSERT INTO projects (name, description, client, engineer, major_revision, minor_revision, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        )?;

        let id = stmt.insert(params![
            project.name,
            project.description,
            project.client,
            project.engineer,
            project.major_revision,
            project.minor_revision,
            project.created_at.to_rfc3339(),
            project.updated_at.to_rfc3339()
        ])?;

        // Create initial revision
        let revision = Revision {
            id: None,
            project_id: id,
            major_revision: project.major_revision.clone(),
            minor_revision: project.minor_revision,
            description: Some("Initial revision".to_string()),
            is_checkpoint: false,
            is_auto_save: false,
            user_name: None,
            change_count: 0,
            parent_revision_id: None,
            created_at: project.created_at,
        };
        self.insert_revision(&revision)?;

        Ok(Project {
            id: Some(id),
            ..project.clone()
        })
    }

    pub fn get_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, description, client, engineer, major_revision, minor_revision, created_at, updated_at 
             FROM projects ORDER BY updated_at DESC"
        )?;

        let project_iter = stmt.query_map([], |row| {
            Ok(Project {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                client: row.get(3)?,
                engineer: row.get(4)?,
                major_revision: row.get(5)?,
                minor_revision: row.get(6)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut projects = Vec::new();
        for project in project_iter {
            projects.push(project?);
        }
        Ok(projects)
    }

    // Revision operations
    pub fn insert_revision(&self, revision: &Revision) -> Result<Revision> {
        let mut stmt = self.connection.prepare(
            "INSERT INTO revisions (project_id, major_revision, minor_revision, description, is_checkpoint, 
             is_auto_save, user_name, change_count, parent_revision_id, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
        )?;

        let id = stmt.insert(params![
            revision.project_id,
            revision.major_revision,
            revision.minor_revision,
            revision.description,
            revision.is_checkpoint,
            revision.is_auto_save,
            revision.user_name,
            revision.change_count,
            revision.parent_revision_id,
            revision.created_at.to_rfc3339()
        ])?;

        Ok(Revision {
            id: Some(id),
            ..revision.clone()
        })
    }

    pub fn get_current_revision_id(&self, project_id: i64) -> Result<i64> {
        let mut stmt = self.connection.prepare(
            "SELECT id FROM revisions WHERE project_id = ?1 ORDER BY id DESC LIMIT 1"
        )?;
        
        let revision_id: i64 = stmt.query_row([project_id], |row| row.get(0))?;
        Ok(revision_id)
    }

    // Cable operations
    pub fn insert_cable(&self, project_id: i64, cable: &NewCable) -> Result<Cable> {
        let now = Utc::now();
        let revision_id = self.get_current_revision_id(project_id)?;

        let mut stmt = self.connection.prepare(
            "INSERT INTO cables (project_id, revision_id, tag, description, function, voltage, current, cable_type, 
             size, cores, segregation_class, from_location, from_equipment, to_location, to_equipment, 
             length, spare_percentage, route, manufacturer, part_number, outer_diameter, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24)"
        )?;

        let id = stmt.insert(params![
            project_id,
            revision_id,
            cable.tag,
            cable.description,
            cable.function,
            cable.voltage,
            cable.current,
            cable.cable_type,
            cable.size,
            cable.cores,
            cable.segregation_class,
            cable.from_location,
            cable.from_equipment,
            cable.to_location,
            cable.to_equipment,
            cable.length,
            cable.spare_percentage,
            cable.route,
            cable.manufacturer,
            cable.part_number,
            cable.outer_diameter,
            cable.notes,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        self.get_cable_by_id(id)
    }

    pub fn get_cables(&self, project_id: i64) -> Result<Vec<Cable>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, function, voltage, current, cable_type, size, cores,
             segregation_class, from_location, from_equipment, to_location, to_equipment, length, 
             spare_percentage, calculated_length, route, manufacturer, part_number, outer_diameter,
             voltage_drop_percentage, segregation_warning, notes, created_at, updated_at
             FROM cables WHERE project_id = ?1 ORDER BY tag"
        )?;

        let cable_iter = stmt.query_map([project_id], |row| {
            Ok(Cable {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                function: row.get(5)?,
                voltage: row.get(6)?,
                current: row.get(7)?,
                cable_type: row.get(8)?,
                size: row.get(9)?,
                cores: row.get(10)?,
                segregation_class: row.get(11)?,
                from_location: row.get(12)?,
                from_equipment: row.get(13)?,
                to_location: row.get(14)?,
                to_equipment: row.get(15)?,
                length: row.get(16)?,
                spare_percentage: row.get(17)?,
                calculated_length: row.get(18)?,
                route: row.get(19)?,
                manufacturer: row.get(20)?,
                part_number: row.get(21)?,
                outer_diameter: row.get(22)?,
                voltage_drop_percentage: row.get(23)?,
                segregation_warning: row.get::<_, i32>(24)? != 0,
                notes: row.get(25)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(26)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(27)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut cables = Vec::new();
        for cable in cable_iter {
            cables.push(cable?);
        }
        Ok(cables)
    }

    pub fn get_cable_by_id(&self, id: i64) -> Result<Cable> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, function, voltage, current, cable_type, size, cores,
             segregation_class, from_location, from_equipment, to_location, to_equipment, length, 
             spare_percentage, calculated_length, route, manufacturer, part_number, outer_diameter,
             voltage_drop_percentage, segregation_warning, notes, created_at, updated_at
             FROM cables WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(Cable {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                function: row.get(5)?,
                voltage: row.get(6)?,
                current: row.get(7)?,
                cable_type: row.get(8)?,
                size: row.get(9)?,
                cores: row.get(10)?,
                segregation_class: row.get(11)?,
                from_location: row.get(12)?,
                from_equipment: row.get(13)?,
                to_location: row.get(14)?,
                to_equipment: row.get(15)?,
                length: row.get(16)?,
                spare_percentage: row.get(17)?,
                calculated_length: row.get(18)?,
                route: row.get(19)?,
                manufacturer: row.get(20)?,
                part_number: row.get(21)?,
                outer_diameter: row.get(22)?,
                voltage_drop_percentage: row.get(23)?,
                segregation_warning: row.get::<_, i32>(24)? != 0,
                notes: row.get(25)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(26)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(27)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn update_cable(&self, id: i64, updates: &UpdateCable) -> Result<Cable> {
        let now = Utc::now();
        
        // For now, implement a simple version that updates all provided fields
        // In a real implementation, you'd build a dynamic query
        let mut stmt = self.connection.prepare(
            "UPDATE cables SET 
             tag = COALESCE(?1, tag),
             description = COALESCE(?2, description),
             function = COALESCE(?3, function),
             voltage = COALESCE(?4, voltage),
             from_equipment = COALESCE(?5, from_equipment),
             to_equipment = COALESCE(?6, to_equipment),
             length = COALESCE(?7, length),
             updated_at = ?8
             WHERE id = ?9"
        )?;

        stmt.execute(params![
            updates.tag,
            updates.description,
            updates.function,
            updates.voltage,
            updates.from_equipment,
            updates.to_equipment,
            updates.length,
            now.to_rfc3339(),
            id
        ])?;

        self.get_cable_by_id(id)
    }

    pub fn delete_cable(&self, id: i64) -> Result<()> {
        self.connection.execute("DELETE FROM cables WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_next_cable_tag(&self, project_id: i64, prefix: &str) -> Result<String> {
        let mut stmt = self.connection.prepare(
            "SELECT tag FROM cables WHERE project_id = ?1 AND tag LIKE ?2 ORDER BY tag"
        )?;

        let pattern = format!("{}-%", prefix);
        let cable_iter = stmt.query_map([project_id.to_string(), pattern], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut max_number = 0;
        let prefix_pattern = format!("{}-", prefix);
        
        for tag_result in cable_iter {
            if let Ok(tag) = tag_result {
                if let Some(number_part) = tag.strip_prefix(&prefix_pattern) {
                    if let Ok(number) = number_part.parse::<i32>() {
                        max_number = max_number.max(number);
                    }
                }
            }
        }

        Ok(format!("{}-{:03}", prefix, max_number + 1))
    }

    // I/O Point operations
    pub fn insert_io_point(&self, project_id: i64, io_point: &NewIOPoint) -> Result<IOPoint> {
        let now = Utc::now();
        let revision_id = self.get_current_revision_id(project_id)?;

        let mut stmt = self.connection.prepare(
            "INSERT INTO io_points (project_id, revision_id, tag, description, signal_type, io_type, 
             plc_name, rack, slot, channel, terminal_block, cable_id, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)"
        )?;

        let id = stmt.insert(params![
            project_id,
            revision_id,
            io_point.tag,
            io_point.description,
            io_point.signal_type,
            io_point.io_type,
            io_point.plc_name,
            io_point.rack,
            io_point.slot,
            io_point.channel,
            io_point.terminal_block,
            io_point.cable_id,
            io_point.notes,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        self.get_io_point_by_id(id)
    }

    pub fn get_io_points(&self, project_id: i64) -> Result<Vec<IOPoint>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, signal_type, io_type, 
             plc_name, rack, slot, channel, terminal_block, cable_id, notes, created_at, updated_at
             FROM io_points WHERE project_id = ?1 ORDER BY tag"
        )?;

        let io_iter = stmt.query_map([project_id], |row| {
            Ok(IOPoint {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                signal_type: row.get(5)?,
                io_type: row.get(6)?,
                plc_name: row.get(7)?,
                rack: row.get(8)?,
                slot: row.get(9)?,
                channel: row.get(10)?,
                terminal_block: row.get(11)?,
                cable_id: row.get(12)?,
                notes: row.get(13)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut io_points = Vec::new();
        for io_point in io_iter {
            io_points.push(io_point?);
        }
        Ok(io_points)
    }

    pub fn get_io_point_by_id(&self, id: i64) -> Result<IOPoint> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, signal_type, io_type, 
             plc_name, rack, slot, channel, terminal_block, cable_id, notes, created_at, updated_at
             FROM io_points WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(IOPoint {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                signal_type: row.get(5)?,
                io_type: row.get(6)?,
                plc_name: row.get(7)?,
                rack: row.get(8)?,
                slot: row.get(9)?,
                channel: row.get(10)?,
                terminal_block: row.get(11)?,
                cable_id: row.get(12)?,
                notes: row.get(13)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn update_io_point(&self, id: i64, updates: &UpdateIOPoint) -> Result<IOPoint> {
        let now = Utc::now();
        
        let mut stmt = self.connection.prepare(
            "UPDATE io_points SET 
             tag = COALESCE(?1, tag),
             description = COALESCE(?2, description),
             signal_type = COALESCE(?3, signal_type),
             io_type = COALESCE(?4, io_type),
             plc_name = COALESCE(?5, plc_name),
             rack = COALESCE(?6, rack),
             slot = COALESCE(?7, slot),
             channel = COALESCE(?8, channel),
             terminal_block = COALESCE(?9, terminal_block),
             cable_id = COALESCE(?10, cable_id),
             notes = COALESCE(?11, notes),
             updated_at = ?12
             WHERE id = ?13"
        )?;

        stmt.execute(params![
            updates.tag,
            updates.description,
            updates.signal_type,
            updates.io_type,
            updates.plc_name,
            updates.rack,
            updates.slot,
            updates.channel,
            updates.terminal_block,
            updates.cable_id,
            updates.notes,
            now.to_rfc3339(),
            id
        ])?;

        self.get_io_point_by_id(id)
    }

    pub fn delete_io_point(&self, id: i64) -> Result<()> {
        self.connection.execute("DELETE FROM io_points WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_io_points_by_plc(&self, project_id: i64, plc_name: &str) -> Result<Vec<IOPoint>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, signal_type, io_type, 
             plc_name, rack, slot, channel, terminal_block, cable_id, notes, created_at, updated_at
             FROM io_points WHERE project_id = ?1 AND plc_name = ?2 ORDER BY rack, slot, channel"
        )?;

        let io_iter = stmt.query_map([project_id.to_string(), plc_name.to_string()], |row| {
            Ok(IOPoint {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                signal_type: row.get(5)?,
                io_type: row.get(6)?,
                plc_name: row.get(7)?,
                rack: row.get(8)?,
                slot: row.get(9)?,
                channel: row.get(10)?,
                terminal_block: row.get(11)?,
                cable_id: row.get(12)?,
                notes: row.get(13)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(14)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(15)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut io_points = Vec::new();
        for io_point in io_iter {
            io_points.push(io_point?);
        }
        Ok(io_points)
    }

    pub fn check_io_address_conflict(&self, project_id: i64, plc_name: &str, rack: i32, slot: i32, channel: i32, exclude_id: Option<i64>) -> Result<bool> {
        let mut query = "SELECT COUNT(*) FROM io_points WHERE project_id = ?1 AND plc_name = ?2 AND rack = ?3 AND slot = ?4 AND channel = ?5".to_string();
        let mut params_vec = vec![project_id.to_string(), plc_name.to_string(), rack.to_string(), slot.to_string(), channel.to_string()];
        
        if let Some(id) = exclude_id {
            query.push_str(" AND id != ?6");
            params_vec.push(id.to_string());
        }

        let mut stmt = self.connection.prepare(&query)?;
        let count: i32 = stmt.query_row(rusqlite::params_from_iter(params_vec), |row| row.get(0))?;
        
        Ok(count > 0)
    }

    // Load operations
    pub fn insert_load(&self, project_id: i64, load: &NewLoad) -> Result<Load> {
        let now = Utc::now();
        let revision_id = self.get_current_revision_id(project_id)?;

        // Calculate derived values
        let (connected_load_kw, demand_load_kw, current) = self.calculate_load_values(load);

        let mut stmt = self.connection.prepare(
            "INSERT INTO loads (project_id, revision_id, tag, description, load_type, power_kw, 
             power_hp, voltage, current, power_factor, efficiency, demand_factor, connected_load_kw,
             demand_load_kw, cable_id, feeder_cable, starter_type, protection_type, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)"
        )?;

        let id = stmt.insert(params![
            project_id,
            revision_id,
            load.tag,
            load.description,
            load.load_type,
            load.power_kw,
            load.power_hp,
            load.voltage,
            current,
            load.power_factor,
            load.efficiency,
            load.demand_factor,
            connected_load_kw,
            demand_load_kw,
            load.cable_id,
            load.feeder_cable,
            load.starter_type,
            load.protection_type,
            load.notes,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        self.get_load_by_id(id)
    }

    pub fn get_loads(&self, project_id: i64) -> Result<Vec<Load>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, load_type, power_kw, power_hp,
             voltage, current, power_factor, efficiency, demand_factor, connected_load_kw, 
             demand_load_kw, cable_id, feeder_cable, starter_type, protection_type, notes, 
             created_at, updated_at
             FROM loads WHERE project_id = ?1 ORDER BY tag"
        )?;

        let load_iter = stmt.query_map([project_id], |row| {
            Ok(Load {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                load_type: row.get(5)?,
                power_kw: row.get(6)?,
                power_hp: row.get(7)?,
                voltage: row.get(8)?,
                current: row.get(9)?,
                power_factor: row.get(10)?,
                efficiency: row.get(11)?,
                demand_factor: row.get(12)?,
                connected_load_kw: row.get(13)?,
                demand_load_kw: row.get(14)?,
                cable_id: row.get(15)?,
                feeder_cable: row.get(16)?,
                starter_type: row.get(17)?,
                protection_type: row.get(18)?,
                notes: row.get(19)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(20)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(21)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut loads = Vec::new();
        for load in load_iter {
            loads.push(load?);
        }
        Ok(loads)
    }

    pub fn get_load_by_id(&self, id: i64) -> Result<Load> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, description, load_type, power_kw, power_hp,
             voltage, current, power_factor, efficiency, demand_factor, connected_load_kw, 
             demand_load_kw, cable_id, feeder_cable, starter_type, protection_type, notes, 
             created_at, updated_at
             FROM loads WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(Load {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                description: row.get(4)?,
                load_type: row.get(5)?,
                power_kw: row.get(6)?,
                power_hp: row.get(7)?,
                voltage: row.get(8)?,
                current: row.get(9)?,
                power_factor: row.get(10)?,
                efficiency: row.get(11)?,
                demand_factor: row.get(12)?,
                connected_load_kw: row.get(13)?,
                demand_load_kw: row.get(14)?,
                cable_id: row.get(15)?,
                feeder_cable: row.get(16)?,
                starter_type: row.get(17)?,
                protection_type: row.get(18)?,
                notes: row.get(19)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(20)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(21)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn update_load(&self, id: i64, updates: &UpdateLoad) -> Result<Load> {
        let now = Utc::now();
        
        // Get current load for calculations
        let current_load = self.get_load_by_id(id)?;
        
        // Create a temporary NewLoad for calculations
        let temp_load = NewLoad {
            tag: updates.tag.clone().unwrap_or(current_load.tag),
            description: updates.description.clone().or(current_load.description),
            load_type: updates.load_type.clone().or(current_load.load_type),
            power_kw: updates.power_kw.or(current_load.power_kw),
            power_hp: updates.power_hp.or(current_load.power_hp),
            voltage: updates.voltage.or(current_load.voltage),
            current: updates.current.or(current_load.current),
            power_factor: updates.power_factor.or(current_load.power_factor),
            efficiency: updates.efficiency.or(current_load.efficiency),
            demand_factor: updates.demand_factor.or(current_load.demand_factor),
            cable_id: updates.cable_id.or(current_load.cable_id),
            feeder_cable: updates.feeder_cable.clone().or(current_load.feeder_cable),
            starter_type: updates.starter_type.clone().or(current_load.starter_type),
            protection_type: updates.protection_type.clone().or(current_load.protection_type),
            notes: updates.notes.clone().or(current_load.notes),
        };

        // Recalculate derived values
        let (connected_load_kw, demand_load_kw, current) = self.calculate_load_values(&temp_load);
        
        let mut stmt = self.connection.prepare(
            "UPDATE loads SET 
             tag = COALESCE(?1, tag),
             description = COALESCE(?2, description),
             load_type = COALESCE(?3, load_type),
             power_kw = COALESCE(?4, power_kw),
             power_hp = COALESCE(?5, power_hp),
             voltage = COALESCE(?6, voltage),
             current = ?7,
             power_factor = COALESCE(?8, power_factor),
             efficiency = COALESCE(?9, efficiency),
             demand_factor = COALESCE(?10, demand_factor),
             connected_load_kw = ?11,
             demand_load_kw = ?12,
             cable_id = COALESCE(?13, cable_id),
             feeder_cable = COALESCE(?14, feeder_cable),
             starter_type = COALESCE(?15, starter_type),
             protection_type = COALESCE(?16, protection_type),
             notes = COALESCE(?17, notes),
             updated_at = ?18
             WHERE id = ?19"
        )?;

        stmt.execute(params![
            updates.tag,
            updates.description,
            updates.load_type,
            updates.power_kw,
            updates.power_hp,
            updates.voltage,
            current,
            updates.power_factor,
            updates.efficiency,
            updates.demand_factor,
            connected_load_kw,
            demand_load_kw,
            updates.cable_id,
            updates.feeder_cable,
            updates.starter_type,
            updates.protection_type,
            updates.notes,
            now.to_rfc3339(),
            id
        ])?;

        self.get_load_by_id(id)
    }

    pub fn delete_load(&self, id: i64) -> Result<()> {
        self.connection.execute("DELETE FROM loads WHERE id = ?1", [id])?;
        Ok(())
    }

    // Helper function to calculate load values
    fn calculate_load_values(&self, load: &NewLoad) -> (Option<f64>, Option<f64>, Option<f64>) {
        let mut connected_kw = load.power_kw;
        let mut calculated_current = load.current;

        // Convert HP to kW if needed
        if let Some(hp) = load.power_hp {
            if load.power_kw.is_none() {
                connected_kw = Some(hp * 0.746); // 1 HP = 0.746 kW
            }
        }

        // Calculate current from power if not provided
        if calculated_current.is_none() {
            if let (Some(kw), Some(voltage)) = (connected_kw, load.voltage) {
                if voltage > 0.0 {
                    let power_factor = load.power_factor.unwrap_or(0.85);
                    let efficiency = load.efficiency.unwrap_or(0.90);
                    
                    // For 3-phase: I = P / (sqrt(3) * V * PF * eff)
                    // For single-phase: I = P / (V * PF * eff)
                    // Assume 3-phase for now (could be made configurable)
                    calculated_current = Some((kw * 1000.0) / (1.732 * voltage * power_factor * efficiency));
                }
            }
        }

        // Calculate demand load
        let demand_kw = connected_kw.map(|ckw| {
            let demand_factor = load.demand_factor.unwrap_or(1.0);
            ckw * demand_factor
        });

        (connected_kw, demand_kw, calculated_current)
    }

    pub fn get_load_summary(&self, project_id: i64) -> Result<(f64, f64, i32)> {
        let mut stmt = self.connection.prepare(
            "SELECT 
                COALESCE(SUM(connected_load_kw), 0) as total_connected,
                COALESCE(SUM(demand_load_kw), 0) as total_demand,
                COUNT(*) as load_count
             FROM loads WHERE project_id = ?1"
        )?;

        stmt.query_row([project_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
    }

    // Conduit operations
    pub fn insert_conduit(&self, project_id: i64, conduit: &NewConduit) -> Result<Conduit> {
        let now = Utc::now();
        let revision_id = self.get_current_revision_id(project_id)?;

        // Calculate initial fill percentage based on cables
        let fill_percentage = self.calculate_conduit_fill_percentage_by_tag(project_id, &conduit.tag)?;

        let mut stmt = self.connection.prepare(
            "INSERT INTO conduits (project_id, revision_id, tag, type, size, internal_diameter, 
             fill_percentage, max_fill_percentage, from_location, to_location, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)"
        )?;

        let id = stmt.insert(params![
            project_id,
            revision_id,
            conduit.tag,
            conduit.r#type,
            conduit.size,
            conduit.internal_diameter,
            fill_percentage,
            40.0, // Default max fill percentage (NEC standard)
            conduit.from_location,
            conduit.to_location,
            conduit.notes,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        self.get_conduit_by_id(id)
    }

    pub fn get_conduits(&self, project_id: i64) -> Result<Vec<Conduit>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, type, size, internal_diameter, 
             fill_percentage, max_fill_percentage, from_location, to_location, notes, 
             created_at, updated_at
             FROM conduits WHERE project_id = ?1 ORDER BY tag"
        )?;

        let conduit_iter = stmt.query_map([project_id], |row| {
            Ok(Conduit {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                r#type: row.get(4)?,
                size: row.get(5)?,
                internal_diameter: row.get(6)?,
                fill_percentage: row.get(7)?,
                max_fill_percentage: row.get(8)?,
                from_location: row.get(9)?,
                to_location: row.get(10)?,
                notes: row.get(11)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(13)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut conduits = Vec::new();
        for conduit in conduit_iter {
            conduits.push(conduit?);
        }
        Ok(conduits)
    }

    pub fn get_conduit_by_id(&self, id: i64) -> Result<Conduit> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, type, size, internal_diameter, 
             fill_percentage, max_fill_percentage, from_location, to_location, notes, 
             created_at, updated_at
             FROM conduits WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(Conduit {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                r#type: row.get(4)?,
                size: row.get(5)?,
                internal_diameter: row.get(6)?,
                fill_percentage: row.get(7)?,
                max_fill_percentage: row.get(8)?,
                from_location: row.get(9)?,
                to_location: row.get(10)?,
                notes: row.get(11)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(13)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn update_conduit(&self, id: i64, updates: &UpdateConduit) -> Result<Conduit> {
        let now = Utc::now();
        
        let mut stmt = self.connection.prepare(
            "UPDATE conduits SET 
             tag = COALESCE(?1, tag),
             type = COALESCE(?2, type),
             size = COALESCE(?3, size),
             internal_diameter = COALESCE(?4, internal_diameter),
             from_location = COALESCE(?5, from_location),
             to_location = COALESCE(?6, to_location),
             notes = COALESCE(?7, notes),
             updated_at = ?8
             WHERE id = ?9"
        )?;

        stmt.execute(params![
            updates.tag,
            updates.r#type,
            updates.size,
            updates.internal_diameter,
            updates.from_location,
            updates.to_location,
            updates.notes,
            now.to_rfc3339(),
            id
        ])?;

        // Recalculate fill percentage after update
        let conduit = self.get_conduit_by_id(id)?;
        let fill_percentage = self.calculate_conduit_fill_percentage_by_tag(conduit.project_id, &conduit.tag)?;
        
        self.connection.execute(
            "UPDATE conduits SET fill_percentage = ?1 WHERE id = ?2",
            params![fill_percentage, id]
        )?;

        self.get_conduit_by_id(id)
    }

    pub fn delete_conduit(&self, id: i64) -> Result<()> {
        self.connection.execute("DELETE FROM conduits WHERE id = ?1", [id])?;
        Ok(())
    }

    // Helper function to calculate conduit fill percentage
    fn calculate_conduit_fill_percentage_by_tag(&self, project_id: i64, conduit_tag: &str) -> Result<f64> {
        // Get the conduit's internal diameter
        let conduit_internal_area = self.get_conduit_internal_area(conduit_tag)?;
        
        if conduit_internal_area <= 0.0 {
            return Ok(0.0);
        }

        // Calculate total cable area in this conduit (route field contains conduit tag)
        let mut stmt = self.connection.prepare(
            "SELECT COALESCE(SUM(PI() * POWER(outer_diameter/2, 2)), 0) as total_cable_area
             FROM cables 
             WHERE project_id = ?1 AND route LIKE ?"
        )?;

        let search_pattern = format!("%{}%", conduit_tag);
        let total_cable_area: f64 = stmt.query_row([project_id.to_string(), search_pattern], |row| {
            Ok(row.get(0)?)
        })?;

        // Calculate fill percentage
        let fill_percentage = (total_cable_area / conduit_internal_area) * 100.0;
        Ok(fill_percentage.min(100.0).max(0.0))
    }

    fn get_conduit_internal_area(&self, conduit_tag: &str) -> Result<f64> {
        let mut stmt = self.connection.prepare(
            "SELECT internal_diameter FROM conduits WHERE tag = ?"
        )?;

        match stmt.query_row([conduit_tag], |row| {
            let diameter: Option<f64> = row.get(0)?;
            Ok(diameter.unwrap_or(0.0))
        }) {
            Ok(diameter) => {
                if diameter > 0.0 {
                    // Area = π * (diameter/2)²
                    Ok(std::f64::consts::PI * (diameter / 2.0).powi(2))
                } else {
                    Ok(0.0)
                }
            },
            Err(_) => Ok(0.0), // Conduit not found or no diameter specified
        }
    }

    pub fn get_conduit_summary(&self, project_id: i64) -> Result<(i32, f64, i32)> {
        let mut stmt = self.connection.prepare(
            "SELECT 
                COUNT(*) as conduit_count,
                COALESCE(AVG(fill_percentage), 0) as avg_fill,
                COUNT(CASE WHEN fill_percentage > max_fill_percentage THEN 1 END) as overfilled_count
             FROM conduits WHERE project_id = ?1"
        )?;

        stmt.query_row([project_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
    }

    // Tray operations
    pub fn get_trays(&self, project_id: i64) -> Result<Vec<Tray>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, type, width, height, length, 
             fill_percentage, max_fill_percentage, material, finish, from_location, 
             to_location, elevation, support_spacing, load_rating, notes, 
             created_at, updated_at
             FROM trays WHERE project_id = ?1 ORDER BY tag"
        )?;

        let tray_iter = stmt.query_map([project_id], |row| {
            Ok(Tray {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                r#type: row.get(4)?,
                width: row.get(5)?,
                height: row.get(6)?,
                length: row.get(7)?,
                fill_percentage: row.get(8)?,
                max_fill_percentage: row.get(9)?,
                material: row.get(10)?,
                finish: row.get(11)?,
                from_location: row.get(12)?,
                to_location: row.get(13)?,
                elevation: row.get(14)?,
                support_spacing: row.get(15)?,
                load_rating: row.get(16)?,
                notes: row.get(17)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(18)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(19)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut trays = Vec::new();
        for tray in tray_iter {
            trays.push(tray?);
        }
        Ok(trays)
    }

    pub fn get_tray_by_id(&self, id: i64) -> Result<Tray> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, revision_id, tag, type, width, height, length, 
             fill_percentage, max_fill_percentage, material, finish, from_location, 
             to_location, elevation, support_spacing, load_rating, notes, 
             created_at, updated_at
             FROM trays WHERE id = ?1"
        )?;

        stmt.query_row([id], |row| {
            Ok(Tray {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                revision_id: row.get(2)?,
                tag: row.get(3)?,
                r#type: row.get(4)?,
                width: row.get(5)?,
                height: row.get(6)?,
                length: row.get(7)?,
                fill_percentage: row.get(8)?,
                max_fill_percentage: row.get(9)?,
                material: row.get(10)?,
                finish: row.get(11)?,
                from_location: row.get(12)?,
                to_location: row.get(13)?,
                elevation: row.get(14)?,
                support_spacing: row.get(15)?,
                load_rating: row.get(16)?,
                notes: row.get(17)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(18)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(19)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn insert_tray(&self, tray_data: &NewTray, project_id: i64, revision_id: i64) -> Result<Tray> {
        let now = Utc::now();
        
        let mut stmt = self.connection.prepare(
            "INSERT INTO trays (project_id, revision_id, tag, type, width, height, length, 
             fill_percentage, max_fill_percentage, material, finish, from_location, 
             to_location, elevation, support_spacing, load_rating, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)"
        )?;

        let id = stmt.insert(params![
            project_id,
            revision_id,
            tray_data.tag,
            tray_data.r#type,
            tray_data.width,
            tray_data.height,
            tray_data.length,
            0.0, // initial fill percentage
            50.0, // default max fill percentage for trays (50% per NEC)
            tray_data.material,
            tray_data.finish,
            tray_data.from_location,
            tray_data.to_location,
            tray_data.elevation,
            tray_data.support_spacing,
            tray_data.load_rating,
            tray_data.notes,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        self.get_tray_by_id(id)
    }

    pub fn update_tray(&self, id: i64, updates: &UpdateTray) -> Result<Tray> {
        let now = Utc::now();
        
        let mut stmt = self.connection.prepare(
            "UPDATE trays SET 
             tag = COALESCE(?1, tag),
             type = COALESCE(?2, type),
             width = COALESCE(?3, width),
             height = COALESCE(?4, height),
             length = COALESCE(?5, length),
             material = COALESCE(?6, material),
             finish = COALESCE(?7, finish),
             from_location = COALESCE(?8, from_location),
             to_location = COALESCE(?9, to_location),
             elevation = COALESCE(?10, elevation),
             support_spacing = COALESCE(?11, support_spacing),
             load_rating = COALESCE(?12, load_rating),
             notes = COALESCE(?13, notes),
             updated_at = ?14
             WHERE id = ?15"
        )?;

        stmt.execute(params![
            updates.tag,
            updates.r#type,
            updates.width,
            updates.height,
            updates.length,
            updates.material,
            updates.finish,
            updates.from_location,
            updates.to_location,
            updates.elevation,
            updates.support_spacing,
            updates.load_rating,
            updates.notes,
            now.to_rfc3339(),
            id
        ])?;

        // Recalculate fill percentage after update
        let tray = self.get_tray_by_id(id)?;
        let fill_percentage = self.calculate_tray_fill_percentage_by_tag(tray.project_id, &tray.tag)?;
        
        self.connection.execute(
            "UPDATE trays SET fill_percentage = ?1 WHERE id = ?2",
            params![fill_percentage, id]
        )?;

        self.get_tray_by_id(id)
    }

    pub fn delete_tray(&self, id: i64) -> Result<()> {
        self.connection.execute("DELETE FROM trays WHERE id = ?1", [id])?;
        Ok(())
    }

    // Helper function to calculate tray fill percentage
    fn calculate_tray_fill_percentage_by_tag(&self, project_id: i64, tray_tag: &str) -> Result<f64> {
        // Get the tray's cross-sectional area (width × height)
        let tray_area = self.get_tray_cross_sectional_area(tray_tag)?;
        
        if tray_area <= 0.0 {
            return Ok(0.0);
        }

        // Calculate total cable cross-sectional area in this tray
        // Assuming cables assigned to trays use tray_id or route field
        let mut stmt = self.connection.prepare(
            "SELECT COALESCE(SUM(PI() * POWER(outer_diameter/2, 2)), 0) as total_cable_area
             FROM cables 
             WHERE project_id = ?1 AND route LIKE ?"
        )?;

        let search_pattern = format!("%{}%", tray_tag);
        let total_cable_area: f64 = stmt.query_row([project_id.to_string(), search_pattern], |row| {
            Ok(row.get(0)?)
        })?;

        // Calculate fill percentage
        let fill_percentage = (total_cable_area / tray_area) * 100.0;
        Ok(fill_percentage.min(100.0).max(0.0))
    }

    fn get_tray_cross_sectional_area(&self, tray_tag: &str) -> Result<f64> {
        let mut stmt = self.connection.prepare(
            "SELECT width, height FROM trays WHERE tag = ?"
        )?;

        match stmt.query_row([tray_tag], |row| {
            let width: Option<f64> = row.get(0)?;
            let height: Option<f64> = row.get(1)?;
            Ok((width.unwrap_or(0.0), height.unwrap_or(0.0)))
        }) {
            Ok((width, height)) => {
                if width > 0.0 && height > 0.0 {
                    // Cross-sectional area = width × height
                    Ok(width * height)
                } else {
                    Ok(0.0)
                }
            },
            Err(_) => Ok(0.0), // Tray not found or no dimensions specified
        }
    }

    pub fn get_tray_summary(&self, project_id: i64) -> Result<(i32, f64, i32)> {
        let mut stmt = self.connection.prepare(
            "SELECT 
                COUNT(*) as tray_count,
                COALESCE(AVG(fill_percentage), 0) as avg_fill,
                COUNT(CASE WHEN fill_percentage > max_fill_percentage THEN 1 END) as overfilled_count
             FROM trays WHERE project_id = ?1"
        )?;

        stmt.query_row([project_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
    }

    // Public methods for fill percentage recalculation
    pub fn calculate_conduit_fill_percentage(&self, conduit_id: i64) -> Result<f64> {
        let conduit = self.get_conduit_by_id(conduit_id)?;
        let fill_percentage = self.calculate_conduit_fill_percentage_by_tag(conduit.project_id, &conduit.tag)?;
        
        // Update the conduit with the new fill percentage
        self.connection.execute(
            "UPDATE conduits SET fill_percentage = ?1 WHERE id = ?2",
            params![fill_percentage, conduit_id]
        )?;
        
        Ok(fill_percentage)
    }

    pub fn calculate_tray_fill_percentage(&self, tray_id: i64) -> Result<f64> {
        let tray = self.get_tray_by_id(tray_id)?;
        let fill_percentage = self.calculate_tray_fill_percentage_by_tag(tray.project_id, &tray.tag)?;
        
        // Update the tray with the new fill percentage
        self.connection.execute(
            "UPDATE trays SET fill_percentage = ?1 WHERE id = ?2",
            params![fill_percentage, tray_id]
        )?;
        
        Ok(fill_percentage)
    }

    // Advanced Revision Tracking Operations
    pub fn create_revision(&self, project_id: i64, new_revision: &NewRevision) -> Result<Revision> {
        let now = Utc::now();
        let revision = Revision {
            id: None,
            project_id,
            major_revision: new_revision.major_revision.clone(),
            minor_revision: new_revision.minor_revision,
            description: new_revision.description.clone(),
            is_checkpoint: new_revision.is_checkpoint,
            is_auto_save: new_revision.is_auto_save,
            user_name: new_revision.user_name.clone(),
            change_count: 0, // Will be updated as changes are tracked
            parent_revision_id: new_revision.parent_revision_id,
            created_at: now,
        };

        self.insert_revision(&revision)
    }

    pub fn get_revision_history(&self, project_id: i64, limit: Option<i32>) -> Result<Vec<RevisionSummary>> {
        let query = match limit {
            Some(_) => "SELECT id, major_revision, minor_revision, description, is_checkpoint, is_auto_save, 
                       user_name, change_count, created_at FROM revisions 
                       WHERE project_id = ?1 ORDER BY id DESC LIMIT ?2",
            None => "SELECT id, major_revision, minor_revision, description, is_checkpoint, is_auto_save, 
                    user_name, change_count, created_at FROM revisions 
                    WHERE project_id = ?1 ORDER BY id DESC"
        };

        let mut stmt = self.connection.prepare(query)?;
        
        let revision_iter = match limit {
            Some(l) => stmt.query_map(params![project_id, l], |row| {
                Ok(RevisionSummary {
                    id: row.get(0)?,
                    major_revision: row.get(1)?,
                    minor_revision: row.get(2)?,
                    description: row.get(3)?,
                    is_checkpoint: row.get(4)?,
                    is_auto_save: row.get(5)?,
                    user_name: row.get(6)?,
                    change_count: row.get(7)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                        .unwrap().with_timezone(&Utc),
                })
            })?,
            None => stmt.query_map([project_id], |row| {
                Ok(RevisionSummary {
                    id: row.get(0)?,
                    major_revision: row.get(1)?,
                    minor_revision: row.get(2)?,
                    description: row.get(3)?,
                    is_checkpoint: row.get(4)?,
                    is_auto_save: row.get(5)?,
                    user_name: row.get(6)?,
                    change_count: row.get(7)?,
                    created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                        .unwrap().with_timezone(&Utc),
                })
            })?
        };

        let mut revisions = Vec::new();
        for revision in revision_iter {
            revisions.push(revision?);
        }
        Ok(revisions)
    }

    pub fn get_revision_by_id(&self, revision_id: i64) -> Result<Revision> {
        let mut stmt = self.connection.prepare(
            "SELECT id, project_id, major_revision, minor_revision, description, is_checkpoint, 
             is_auto_save, user_name, change_count, parent_revision_id, created_at 
             FROM revisions WHERE id = ?1"
        )?;

        stmt.query_row([revision_id], |row| {
            Ok(Revision {
                id: Some(row.get(0)?),
                project_id: row.get(1)?,
                major_revision: row.get(2)?,
                minor_revision: row.get(3)?,
                description: row.get(4)?,
                is_checkpoint: row.get(5)?,
                is_auto_save: row.get(6)?,
                user_name: row.get(7)?,
                change_count: row.get(8)?,
                parent_revision_id: row.get(9)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?)
                    .unwrap().with_timezone(&Utc),
            })
        })
    }

    pub fn insert_revision_change(&self, revision_id: i64, change: &NewRevisionChange) -> Result<RevisionChange> {
        let now = Utc::now();
        let mut stmt = self.connection.prepare(
            "INSERT INTO revision_changes (revision_id, entity_type, entity_id, entity_tag, 
             change_type, field_name, old_value, new_value, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
        )?;

        let id = stmt.insert(params![
            revision_id,
            change.entity_type,
            change.entity_id,
            change.entity_tag,
            change.change_type,
            change.field_name,
            change.old_value,
            change.new_value,
            now.to_rfc3339()
        ])?;

        // Update the change count in the revision
        self.connection.execute(
            "UPDATE revisions SET change_count = change_count + 1 WHERE id = ?1",
            [revision_id]
        )?;

        Ok(RevisionChange {
            id: Some(id),
            revision_id,
            entity_type: change.entity_type.clone(),
            entity_id: change.entity_id,
            entity_tag: change.entity_tag.clone(),
            change_type: change.change_type.clone(),
            field_name: change.field_name.clone(),
            old_value: change.old_value.clone(),
            new_value: change.new_value.clone(),
            created_at: now,
        })
    }

    pub fn get_revision_changes(&self, revision_id: i64) -> Result<Vec<RevisionChange>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, revision_id, entity_type, entity_id, entity_tag, change_type, 
             field_name, old_value, new_value, created_at 
             FROM revision_changes WHERE revision_id = ?1 ORDER BY id"
        )?;

        let change_iter = stmt.query_map([revision_id], |row| {
            Ok(RevisionChange {
                id: Some(row.get(0)?),
                revision_id: row.get(1)?,
                entity_type: row.get(2)?,
                entity_id: row.get(3)?,
                entity_tag: row.get(4)?,
                change_type: row.get(5)?,
                field_name: row.get(6)?,
                old_value: row.get(7)?,
                new_value: row.get(8)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut changes = Vec::new();
        for change in change_iter {
            changes.push(change?);
        }
        Ok(changes)
    }

    pub fn get_entity_change_history(&self, project_id: i64, entity_type: &str, entity_id: i64) -> Result<Vec<RevisionChange>> {
        let mut stmt = self.connection.prepare(
            "SELECT rc.id, rc.revision_id, rc.entity_type, rc.entity_id, rc.entity_tag, 
             rc.change_type, rc.field_name, rc.old_value, rc.new_value, rc.created_at 
             FROM revision_changes rc 
             JOIN revisions r ON rc.revision_id = r.id 
             WHERE r.project_id = ?1 AND rc.entity_type = ?2 AND rc.entity_id = ?3 
             ORDER BY rc.id"
        )?;

        let change_iter = stmt.query_map(params![project_id, entity_type, entity_id], |row| {
            Ok(RevisionChange {
                id: Some(row.get(0)?),
                revision_id: row.get(1)?,
                entity_type: row.get(2)?,
                entity_id: row.get(3)?,
                entity_tag: row.get(4)?,
                change_type: row.get(5)?,
                field_name: row.get(6)?,
                old_value: row.get(7)?,
                new_value: row.get(8)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;

        let mut changes = Vec::new();
        for change in change_iter {
            changes.push(change?);
        }
        Ok(changes)
    }

    pub fn create_auto_save_revision(&self, project_id: i64) -> Result<Revision> {
        // Get the current revision to use as parent
        let current_revision_id = self.get_current_revision_id(project_id).ok();
        
        let new_revision = NewRevision {
            major_revision: "Draft".to_string(),
            minor_revision: 0, // Will be auto-incremented
            description: Some("Auto-save".to_string()),
            is_checkpoint: false,
            is_auto_save: true,
            user_name: None,
            parent_revision_id: current_revision_id,
        };

        self.create_revision(project_id, &new_revision)
    }

    pub fn prune_old_revisions(&self, project_id: i64, keep_count: i32) -> Result<i32> {
        // Keep checkpoints and recent revisions, but prune old auto-saves
        let mut stmt = self.connection.prepare(
            "DELETE FROM revisions 
             WHERE project_id = ?1 
             AND is_checkpoint = 0 
             AND is_auto_save = 1 
             AND id NOT IN (
                 SELECT id FROM revisions 
                 WHERE project_id = ?1 
                 ORDER BY id DESC 
                 LIMIT ?2
             )"
        )?;

        let deleted_count = stmt.execute(params![project_id, keep_count])?;
        Ok(deleted_count as i32)
    }

    pub fn create_checkpoint(&self, project_id: i64, description: String, user_name: Option<String>) -> Result<Revision> {
        let current_revision_id = self.get_current_revision_id(project_id).ok();
        
        let new_revision = NewRevision {
            major_revision: "Draft".to_string(),
            minor_revision: 0,
            description: Some(description),
            is_checkpoint: true,
            is_auto_save: false,
            user_name,
            parent_revision_id: current_revision_id,
        };

        self.create_revision(project_id, &new_revision)
    }

    // Cable Library operations
    pub fn get_cable_library_items(&self, search_term: Option<String>, category: Option<String>) -> Result<Vec<CableLibraryItem>> {
        let base_query = "SELECT id, name, manufacturer, part_number, cable_type, size, cores, 
                          voltage_rating, current_rating, outer_diameter, weight_per_meter, 
                          temperature_rating, conductor_material, insulation_type, jacket_material, 
                          shielding, armor, fire_rating, category, description, specifications, 
                          datasheet_url, cost_per_meter, is_active, created_at, updated_at 
                          FROM cable_library WHERE is_active = 1";
        
        let mut conditions = Vec::new();
        let mut params_vec = Vec::new();
        
        if let Some(search) = &search_term {
            conditions.push("(name LIKE ?1 OR manufacturer LIKE ?1 OR part_number LIKE ?1 OR description LIKE ?1)");
            params_vec.push(format!("%{}%", search));
        }
        
        if let Some(cat) = &category {
            let param_index = params_vec.len() + 1;
            conditions.push(&format!("category = ?{}", param_index));
            params_vec.push(cat.clone());
        }
        
        let final_query = if conditions.is_empty() {
            format!("{} ORDER BY category, name", base_query)
        } else {
            format!("{} AND {} ORDER BY category, name", base_query, conditions.join(" AND "))
        };
        
        let mut stmt = self.connection.prepare(&final_query)?;
        let params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p as &dyn rusqlite::ToSql).collect();
        
        let library_iter = stmt.query_map(params.as_slice(), |row| {
            Ok(CableLibraryItem {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                manufacturer: row.get(2)?,
                part_number: row.get(3)?,
                cable_type: row.get(4)?,
                size: row.get(5)?,
                cores: row.get(6)?,
                voltage_rating: row.get(7)?,
                current_rating: row.get(8)?,
                outer_diameter: row.get(9)?,
                weight_per_meter: row.get(10)?,
                temperature_rating: row.get(11)?,
                conductor_material: row.get(12)?,
                insulation_type: row.get(13)?,
                jacket_material: row.get(14)?,
                shielding: row.get(15)?,
                armor: row.get(16)?,
                fire_rating: row.get(17)?,
                category: row.get(18)?,
                description: row.get(19)?,
                specifications: row.get(20)?,
                datasheet_url: row.get(21)?,
                cost_per_meter: row.get(22)?,
                is_active: row.get(23)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(24)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(25)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;
        
        let mut items = Vec::new();
        for item in library_iter {
            items.push(item?);
        }
        Ok(items)
    }

    pub fn create_cable_library_item(&self, item: &NewCableLibraryItem) -> Result<CableLibraryItem> {
        let now = Utc::now();
        let is_active = item.is_active.unwrap_or(true);
        
        let mut stmt = self.connection.prepare(
            "INSERT INTO cable_library (name, manufacturer, part_number, cable_type, size, cores,
             voltage_rating, current_rating, outer_diameter, weight_per_meter, temperature_rating,
             conductor_material, insulation_type, jacket_material, shielding, armor, fire_rating,
             category, description, specifications, datasheet_url, cost_per_meter, is_active,
             created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25)"
        )?;

        let id = stmt.insert(params![
            item.name,
            item.manufacturer,
            item.part_number,
            item.cable_type,
            item.size,
            item.cores,
            item.voltage_rating,
            item.current_rating,
            item.outer_diameter,
            item.weight_per_meter,
            item.temperature_rating,
            item.conductor_material,
            item.insulation_type,
            item.jacket_material,
            item.shielding,
            item.armor,
            item.fire_rating,
            item.category,
            item.description,
            item.specifications,
            item.datasheet_url,
            item.cost_per_meter,
            is_active,
            now.to_rfc3339(),
            now.to_rfc3339()
        ])?;

        Ok(CableLibraryItem {
            id: Some(id),
            name: item.name.clone(),
            manufacturer: item.manufacturer.clone(),
            part_number: item.part_number.clone(),
            cable_type: item.cable_type.clone(),
            size: item.size.clone(),
            cores: item.cores,
            voltage_rating: item.voltage_rating,
            current_rating: item.current_rating,
            outer_diameter: item.outer_diameter,
            weight_per_meter: item.weight_per_meter,
            temperature_rating: item.temperature_rating,
            conductor_material: item.conductor_material.clone(),
            insulation_type: item.insulation_type.clone(),
            jacket_material: item.jacket_material.clone(),
            shielding: item.shielding.clone(),
            armor: item.armor.clone(),
            fire_rating: item.fire_rating.clone(),
            category: item.category.clone(),
            description: item.description.clone(),
            specifications: item.specifications.clone(),
            datasheet_url: item.datasheet_url.clone(),
            cost_per_meter: item.cost_per_meter,
            is_active,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_cable_library_item(&self, id: i64, updates: &UpdateCableLibraryItem) -> Result<CableLibraryItem> {
        let now = Utc::now();
        
        // Build dynamic UPDATE statement
        let mut set_clauses = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(name) = &updates.name {
            set_clauses.push("name = ?");
            params_vec.push(Box::new(name.clone()));
        }
        if let Some(manufacturer) = &updates.manufacturer {
            set_clauses.push("manufacturer = ?");
            params_vec.push(Box::new(manufacturer.clone()));
        }
        if let Some(part_number) = &updates.part_number {
            set_clauses.push("part_number = ?");
            params_vec.push(Box::new(part_number.clone()));
        }
        if let Some(cable_type) = &updates.cable_type {
            set_clauses.push("cable_type = ?");
            params_vec.push(Box::new(cable_type.clone()));
        }
        if let Some(size) = &updates.size {
            set_clauses.push("size = ?");
            params_vec.push(Box::new(size.clone()));
        }
        if let Some(cores) = &updates.cores {
            set_clauses.push("cores = ?");
            params_vec.push(Box::new(*cores));
        }
        if let Some(voltage_rating) = &updates.voltage_rating {
            set_clauses.push("voltage_rating = ?");
            params_vec.push(Box::new(*voltage_rating));
        }
        if let Some(current_rating) = &updates.current_rating {
            set_clauses.push("current_rating = ?");
            params_vec.push(Box::new(*current_rating));
        }
        if let Some(outer_diameter) = &updates.outer_diameter {
            set_clauses.push("outer_diameter = ?");
            params_vec.push(Box::new(*outer_diameter));
        }
        if let Some(weight_per_meter) = &updates.weight_per_meter {
            set_clauses.push("weight_per_meter = ?");
            params_vec.push(Box::new(*weight_per_meter));
        }
        if let Some(temperature_rating) = &updates.temperature_rating {
            set_clauses.push("temperature_rating = ?");
            params_vec.push(Box::new(*temperature_rating));
        }
        if let Some(conductor_material) = &updates.conductor_material {
            set_clauses.push("conductor_material = ?");
            params_vec.push(Box::new(conductor_material.clone()));
        }
        if let Some(insulation_type) = &updates.insulation_type {
            set_clauses.push("insulation_type = ?");
            params_vec.push(Box::new(insulation_type.clone()));
        }
        if let Some(jacket_material) = &updates.jacket_material {
            set_clauses.push("jacket_material = ?");
            params_vec.push(Box::new(jacket_material.clone()));
        }
        if let Some(shielding) = &updates.shielding {
            set_clauses.push("shielding = ?");
            params_vec.push(Box::new(shielding.clone()));
        }
        if let Some(armor) = &updates.armor {
            set_clauses.push("armor = ?");
            params_vec.push(Box::new(armor.clone()));
        }
        if let Some(fire_rating) = &updates.fire_rating {
            set_clauses.push("fire_rating = ?");
            params_vec.push(Box::new(fire_rating.clone()));
        }
        if let Some(category) = &updates.category {
            set_clauses.push("category = ?");
            params_vec.push(Box::new(category.clone()));
        }
        if let Some(description) = &updates.description {
            set_clauses.push("description = ?");
            params_vec.push(Box::new(description.clone()));
        }
        if let Some(specifications) = &updates.specifications {
            set_clauses.push("specifications = ?");
            params_vec.push(Box::new(specifications.clone()));
        }
        if let Some(datasheet_url) = &updates.datasheet_url {
            set_clauses.push("datasheet_url = ?");
            params_vec.push(Box::new(datasheet_url.clone()));
        }
        if let Some(cost_per_meter) = &updates.cost_per_meter {
            set_clauses.push("cost_per_meter = ?");
            params_vec.push(Box::new(*cost_per_meter));
        }
        if let Some(is_active) = &updates.is_active {
            set_clauses.push("is_active = ?");
            params_vec.push(Box::new(*is_active));
        }
        
        // Always update the updated_at field
        set_clauses.push("updated_at = ?");
        params_vec.push(Box::new(now.to_rfc3339()));
        
        // Add the ID parameter for WHERE clause
        params_vec.push(Box::new(id));
        
        let query = format!(
            "UPDATE cable_library SET {} WHERE id = ?",
            set_clauses.join(", ")
        );
        
        let params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        self.connection.execute(&query, params.as_slice())?;
        
        // Return the updated item
        self.get_cable_library_item(id)
    }

    pub fn get_cable_library_item(&self, id: i64) -> Result<CableLibraryItem> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, manufacturer, part_number, cable_type, size, cores, 
             voltage_rating, current_rating, outer_diameter, weight_per_meter, 
             temperature_rating, conductor_material, insulation_type, jacket_material, 
             shielding, armor, fire_rating, category, description, specifications, 
             datasheet_url, cost_per_meter, is_active, created_at, updated_at 
             FROM cable_library WHERE id = ?1"
        )?;

        let item = stmt.query_row(params![id], |row| {
            Ok(CableLibraryItem {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                manufacturer: row.get(2)?,
                part_number: row.get(3)?,
                cable_type: row.get(4)?,
                size: row.get(5)?,
                cores: row.get(6)?,
                voltage_rating: row.get(7)?,
                current_rating: row.get(8)?,
                outer_diameter: row.get(9)?,
                weight_per_meter: row.get(10)?,
                temperature_rating: row.get(11)?,
                conductor_material: row.get(12)?,
                insulation_type: row.get(13)?,
                jacket_material: row.get(14)?,
                shielding: row.get(15)?,
                armor: row.get(16)?,
                fire_rating: row.get(17)?,
                category: row.get(18)?,
                description: row.get(19)?,
                specifications: row.get(20)?,
                datasheet_url: row.get(21)?,
                cost_per_meter: row.get(22)?,
                is_active: row.get(23)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(24)?)
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(25)?)
                    .unwrap().with_timezone(&Utc),
            })
        })?;
        
        Ok(item)
    }

    pub fn delete_cable_library_item(&self, id: i64) -> Result<()> {
        // Soft delete by setting is_active to false
        self.connection.execute(
            "UPDATE cable_library SET is_active = 0, updated_at = ?1 WHERE id = ?2",
            params![Utc::now().to_rfc3339(), id]
        )?;
        Ok(())
    }

    pub fn import_cable_from_library(&self, project_id: i64, revision_id: i64, library_id: i64, tag: String) -> Result<Cable> {
        // Get the library item
        let library_item = self.get_cable_library_item(library_id)?;
        
        // Create a new cable from the library item
        let new_cable = NewCable {
            tag,
            description: library_item.description,
            function: Some("Power".to_string()), // Default, can be changed
            voltage: library_item.voltage_rating,
            current: library_item.current_rating,
            cable_type: Some(library_item.cable_type),
            size: Some(library_item.size),
            cores: Some(library_item.cores),
            segregation_class: None,
            from_location: None,
            from_equipment: None,
            to_location: None,
            to_equipment: None,
            length: None,
            spare_percentage: None,
            route: None,
            manufacturer: library_item.manufacturer,
            part_number: library_item.part_number,
            outer_diameter: library_item.outer_diameter,
            tray_id: None,
            conduit_id: None,
            notes: Some(format!("Imported from library: {}", library_item.name)),
        };
        
        self.create_cable(project_id, revision_id, &new_cable)
    }
}