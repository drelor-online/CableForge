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
            "INSERT INTO revisions (project_id, major_revision, minor_revision, description, is_checkpoint, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
        )?;

        let id = stmt.insert(params![
            revision.project_id,
            revision.major_revision,
            revision.minor_revision,
            revision.description,
            revision.is_checkpoint,
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
}