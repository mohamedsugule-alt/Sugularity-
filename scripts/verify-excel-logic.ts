
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Mock ImportTemplate type
type ImportTemplate = {
    settings: any;
    pillars: any[];
};

async function verifyExcelLogic() {
    console.log("Starting Excel Logic Verification...");
    const filePath = path.join(__dirname, 'test_template.xlsx');

    try {
        // --- 1. GENERATION LOGIC (Simulating Download) ---
        console.log("1. Generating Excel file...");
        const wb = XLSX.utils.book_new();

        // Settings Sheet
        const settingsData = [
            { Key: "dailyCapacityHours", Value: 6, Description: "Hours per day" },
            { Key: "workDayStart", Value: "09:00", Description: "HH:MM format" },
            { Key: "workDayEnd", Value: "17:00", Description: "HH:MM format" },
            { Key: "coldTaskDays", Value: 14, Description: "Days until task becomes cold" },
            { Key: "requireEstimate", Value: true, Description: "Require estimate" },
        ];
        const wsSettings = XLSX.utils.json_to_sheet(settingsData);
        XLSX.utils.book_append_sheet(wb, wsSettings, "Settings");

        // Pillars Sheet
        const pillarsData = [
            { Name: "Health & Fitness", Color: "#10B981", Icon: "activity" },
            { Name: "Career & Business", Color: "#3B82F6", Icon: "briefcase" },
        ];
        const wsPillars = XLSX.utils.json_to_sheet(pillarsData);
        XLSX.utils.book_append_sheet(wb, wsPillars, "Pillars");

        // Goals Sheet
        const goalsData = [
            { Pillar: "Health & Fitness", "Goal Title": "Run a Marathon", Description: "Complete 42km by Dec", Status: "active" },
        ];
        const wsGoals = XLSX.utils.json_to_sheet(goalsData);
        XLSX.utils.book_append_sheet(wb, wsGoals, "Goals");

        // Projects Sheet
        const projectsData = [
            { "Goal Title": "Run a Marathon", "Project Title": "Marathon Training Plan", Description: "16-week cycle", Status: "active", Pillar: "Health & Fitness" },
        ];
        const wsProjects = XLSX.utils.json_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");

        // Rituals Sheet
        const ritualsData = [
            { "Goal Title": "Run a Marathon", "Ritual Title": "Morning Run", Cadence: "daily", Target: 5, Pillar: "Health & Fitness" },
        ];
        const wsRituals = XLSX.utils.json_to_sheet(ritualsData);
        XLSX.utils.book_append_sheet(wb, wsRituals, "Rituals");

        // Milestones Sheet
        const milestonesData = [
            { "Project Title": "Marathon Training Plan", "Milestone Title": "Run 10km", Status: "completed" },
        ];
        const wsMilestones = XLSX.utils.json_to_sheet(milestonesData);
        XLSX.utils.book_append_sheet(wb, wsMilestones, "Milestones");

        // Write file
        XLSX.writeFile(wb, filePath);
        console.log(`   File written to ${filePath}`);


        // --- 2. PARSING LOGIC (Simulating Upload) ---
        console.log("2. Parsing Excel file...");
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer);

        const getSheetData = (sheetName: string) => {
            const sheet = workbook.Sheets[sheetName];
            return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
        };

        const settingsRows = getSheetData('Settings') as any[];
        const pillarRows = getSheetData('Pillars') as any[];
        const goalRows = getSheetData('Goals') as any[];
        const projectRows = getSheetData('Projects') as any[];
        const ritualRows = getSheetData('Rituals') as any[];
        const milestoneRows = getSheetData('Milestones') as any[];

        const importData: ImportTemplate = {
            settings: {},
            pillars: []
        };

        // 1. Settings
        settingsRows.forEach(row => {
            if (row.Key && row.Value !== undefined) {
                let val = row.Value;
                if (['dailyCapacityHours', 'defaultEstimateMin', 'coldTaskDays'].includes(row.Key)) {
                    val = Number(val);
                }
                if (['requireEstimate', 'showColdInToday'].includes(row.Key)) {
                    val = String(val).toLowerCase() === 'true';
                }
                importData.settings[row.Key] = val;
            }
        });

        // 2. Pillars
        const pillarMap = new Map<string, any>();
        pillarRows.forEach(row => {
            if (row.Name) {
                const pillar = {
                    name: row.Name,
                    colorHex: row.Color || '#8B5CF6',
                    icon: row.Icon,
                    goals: [],
                    projects: [],
                    rituals: []
                };
                pillarMap.set(row.Name, pillar);
                importData.pillars.push(pillar);
            }
        });

        // 3. Goals
        const goalMap = new Map<string, any>();
        goalRows.forEach(row => {
            if (row['Goal Title'] && row.Pillar) {
                const pillar = pillarMap.get(row.Pillar);
                if (pillar) {
                    const goal = {
                        title: row['Goal Title'],
                        description: row.Description,
                        status: row.Status || 'active',
                        projects: [],
                        rituals: []
                    };
                    pillar.goals.push(goal);
                    goalMap.set(row['Goal Title'], goal);
                }
            }
        });

        // 4. Projects
        const projectMap = new Map<string, any>();
        projectRows.forEach(row => {
            if (row['Project Title']) {
                const project = {
                    title: row['Project Title'],
                    description: row.Description,
                    status: row.Status || 'active',
                    milestones: []
                };
                projectMap.set(row['Project Title'], project);

                if (row['Goal Title']) {
                    const goal = goalMap.get(row['Goal Title']);
                    if (goal) {
                        goal.projects.push(project);
                    }
                }
            }
        });

        // 5. Rituals
        ritualRows.forEach(row => {
            if (row['Ritual Title']) {
                const ritual = {
                    title: row['Ritual Title'],
                    cadenceType: row.Cadence || 'weekly',
                    targetPerCycle: row.Target || 3
                };

                if (row['Goal Title']) {
                    const goal = goalMap.get(row['Goal Title']);
                    if (goal) goal.rituals.push(ritual);
                }
            }
        });

        // 6. Milestones
        milestoneRows.forEach(row => {
            if (row['Milestone Title'] && row['Project Title']) {
                const project = projectMap.get(row['Project Title']);
                if (project) {
                    project.milestones.push({
                        title: row['Milestone Title'],
                        status: row.Status || 'not_started'
                    });
                }
            }
        });

        // --- 3. VERIFICATION ---
        console.log("3. Verifying parsed data...");
        // console.log(JSON.stringify(importData, null, 2));

        if (importData.settings.dailyCapacityHours !== 6) throw new Error("Settings mismatch: dailyCapacityHours");
        if (importData.settings.requireEstimate !== true) throw new Error("Settings mismatch: requireEstimate");

        if (importData.pillars.length !== 2) throw new Error("Pillars count mismatch");
        const healthPillar = importData.pillars.find(p => p.name === "Health & Fitness");
        if (!healthPillar) throw new Error("Health pillar missing");

        if (healthPillar.goals.length !== 1) throw new Error("Goals count mismatch");
        const marathonGoal = healthPillar.goals[0];
        if (marathonGoal.title !== "Run a Marathon") throw new Error("Goal title mismatch");

        if (marathonGoal.projects.length !== 1) throw new Error("Projects count mismatch");
        const trainingProject = marathonGoal.projects[0];
        if (trainingProject.title !== "Marathon Training Plan") throw new Error("Project title mismatch");

        if (trainingProject.milestones.length !== 1) throw new Error("Milestones count mismatch");
        if (trainingProject.milestones[0].title !== "Run 10km") throw new Error("Milestone title mismatch");

        if (marathonGoal.rituals.length !== 1) throw new Error("Rituals count mismatch");
        if (marathonGoal.rituals[0].title !== "Morning Run") throw new Error("Ritual title mismatch");

        console.log("✅ Verification SUCCESS!");

    } catch (e: any) {
        console.error("❌ Verification FAILED:", e.message);
        process.exit(1);
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("   Cleaned up test file.");
        }
    }
}

verifyExcelLogic();
