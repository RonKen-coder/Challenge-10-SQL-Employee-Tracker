import inquirer from 'inquirer';
import logo from 'asciiart-logo';
import { pool, connectToDb } from './connection.js';
connectToDb();
const db = pool;
init();
function init() {
    console.log(logo({
        name: 'Employee Manager',
        borderColor: 'blue',
        logoColor: 'bold-green',
        textColor: 'white',
    }).render());
    loadMainPrompts();
}
function loadMainPrompts() {
    inquirer
        .prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                'View Employees by Manager',
                'View Employees by Department',
                'View Department Budget',
                'Add a Department',
                'Add a Role',
                'Add an Employee',
                'Update Employee Role',
                'Update Employee Manager',
                'Delete Department',
                'Delete Role',
                'Delete Employee',
                'Quit',
            ],
        },
    ])
        .then((answer) => {
        switch (answer.action) {
            case 'View All Departments':
                viewDepartments();
                break;
            case 'View All Roles':
                viewAllRoles();
                break;
            case 'View All Employees':
                viewEmployees();
                break;
            case 'View Employees by Manager':
                viewEmployeesByManager();
                break;
            case 'View Employees by Department':
                viewEmployeesByDepartment();
                break;
            case 'View Department Budget':
                viewDepartmentBudget();
                break;
            case 'Add a Department':
                addDepartment();
                break;
            case 'Add a Role':
                addRole();
                break;
            case 'Add an Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                updateEmployeeRole();
                break;
            case 'Update Employee Manager':
                updateEmployeeManager();
                break;
            case 'Delete Department':
                deleteDepartment();
                break;
            case 'Delete Role':
                deleteRole();
                break;
            case 'Delete Employee':
                deleteEmployee();
                break;
            case 'Quit':
                quit();
                break;
        }
    });
}
function viewDepartments() {
    db.query('SELECT * FROM department')
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    });
}
function viewAllRoles() {
    db.query('SELECT * FROM role')
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    });
}
function viewEmployees() {
    db.query('SELECT * FROM employee')
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    });
}
function viewEmployeesByManagers() {
    db.query('SELECT * FROM employeesByManagers')
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    });
}
function viewDepartmentBudget() {
    db.query('SELECT * FROM department')
        .then((res) => {
        const departmentChoices = res.rows.map((dept) => ({
            name: dept.name,
            value: dept.id,
        }));
        return inquirer.prompt([
            {
                name: 'departmentId',
                type: 'list',
                message: 'Select a department to view its total utilized budget:',
                choices: departmentChoices,
            },
        ]);
    })
        .then((answer) => {
        const query = `
        SELECT 
          department.name AS department,
          SUM(role.salary) AS total_budget
        FROM employee
        INNER JOIN role ON employee.role_id = role.id
        INNER JOIN department ON role.department_id = department.id
        WHERE department.id = $1
        GROUP BY department.name;
      `;
        db.query(query, [answer.departmentId])
            .then((res) => {
            if (res.rows.length > 0) {
                console.table(res.rows);
            }
            else {
                console.log('No employees in this department.');
            }
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    })
        .catch((err) => console.error('Error:', err));
}
// function viewEmployeesByDepartment removed due to duplication
function viewEmployeesByManager() {
    const query = `
    SELECT 
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager,
      CONCAT(employee.first_name, ' ', employee.last_name) AS employee
    FROM employee
    LEFT JOIN employee AS manager
    ON employee.manager_id = manager.id
    ORDER BY manager, employee;
  `;
    db.query(query)
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    })
        .catch((err) => console.error('Error:', err));
}
function viewEmployeesByDepartment() {
    const query = `
    SELECT 
      department.name AS department,
      CONCAT(employee.first_name, ' ', employee.last_name) AS employee,
      role.title AS role
    FROM employee
    INNER JOIN role ON employee.role_id = role.id
    INNER JOIN department ON role.department_id = department.id
    ORDER BY department, employee;
  `;
    db.query(query)
        .then((res) => {
        console.table(res.rows);
        loadMainPrompts();
    })
        .catch((err) => console.error('Error:', err));
}
function addDepartment() {
    inquirer
        .prompt([
        {
            name: 'departmentName',
            type: 'input',
            message: 'Enter the name of the new department:',
            validate: (input) => input.trim() !== '' || 'Department name cannot be empty!',
        },
    ])
        .then((answer) => {
        const query = 'INSERT INTO department (name) VALUES ($1)';
        db.query(query, [answer.departmentName])
            .then(() => {
            console.log(`Added ${answer.departmentName} to the database.`);
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    });
}
function addRole() {
    db.query('SELECT * FROM department')
        .then((res) => {
        const departmentChoices = res.rows.map((dept) => ({
            name: dept.name,
            value: dept.id,
        }));
        return inquirer.prompt([
            {
                name: 'roleTitle',
                type: 'input',
                message: 'Enter the title of the new role:',
                validate: (input) => input.trim() !== '' || 'Role title cannot be empty!',
            },
            {
                name: 'roleSalary',
                type: 'number',
                message: 'Enter the salary for the new role:',
                validate: (input) => input > 0 || 'Salary must be a positive number!',
            },
            {
                name: 'departmentId',
                type: 'list',
                message: 'Select the department for this role:',
                choices: departmentChoices,
            },
        ]);
    })
        .then((answers) => {
        const query = 'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)';
        db.query(query, [answers.roleTitle, answers.roleSalary, answers.departmentId])
            .then(() => {
            console.log(`Added ${answers.roleTitle} to the database.`);
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    })
        .catch((err) => console.error('Error:', err));
}
function addEmployee() {
    db.query('SELECT * FROM role')
        .then((roleRes) => {
        const roleChoices = roleRes.rows.map((role) => ({
            name: role.title,
            value: role.id,
        }));
        return db.query('SELECT * FROM employee').then((employeeRes) => {
            const managerChoices = employeeRes.rows.map((emp) => ({
                name: `${emp.first_name} ${emp.last_name}`,
                value: emp.id,
            }));
            managerChoices.unshift({ name: 'None', value: null });
            return inquirer.prompt([
                {
                    name: 'firstName',
                    type: 'input',
                    message: 'Enter the first name of the employee:',
                    validate: (input) => input.trim() !== '' || 'First name cannot be empty!',
                },
                {
                    name: 'lastName',
                    type: 'input',
                    message: 'Enter the last name of the employee:',
                    validate: (input) => input.trim() !== '' || 'Last name cannot be empty!',
                },
                {
                    name: 'roleId',
                    type: 'list',
                    message: 'Select the role for this employee:',
                    choices: roleChoices,
                },
                {
                    name: 'managerId',
                    type: 'list',
                    message: 'Select the manager for this employee (or None):',
                    choices: managerChoices,
                },
            ]);
        });
    })
        .then((answers) => {
        const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
        db.query(query, [answers.firstName, answers.lastName, answers.roleId, answers.managerId])
            .then(() => {
            console.log(`Added ${answers.firstName} ${answers.lastName} to the database.`);
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    })
        .catch((err) => console.error('Error:', err));
}
function updateEmployeeRole() {
    db.query('SELECT * FROM employee')
        .then((employeeRes) => {
        const employeeChoices = employeeRes.rows.map((emp) => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id,
        }));
        return db.query('SELECT * FROM role').then((roleRes) => {
            const roleChoices = roleRes.rows.map((role) => ({
                name: role.title,
                value: role.id,
            }));
            return inquirer.prompt([
                {
                    name: 'employeeId',
                    type: 'list',
                    message: 'Select the employee to update:',
                    choices: employeeChoices,
                },
                {
                    name: 'newRoleId',
                    type: 'list',
                    message: 'Select the new role for this employee:',
                    choices: roleChoices,
                },
            ]);
        });
    })
        .then((answers) => {
        const query = 'UPDATE employee SET role_id = $1 WHERE id = $2';
        db.query(query, [answers.newRoleId, answers.employeeId])
            .then(() => {
            console.log('Employee role updated successfully!');
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    })
        .catch((err) => console.error('Error:', err));
}
function updateEmployeeManager() {
    db.query('SELECT * FROM employee')
        .then((employeeRes) => {
        const employeeChoices = employeeRes.rows.map((emp) => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id,
        }));
        return inquirer.prompt([
            {
                name: 'employeeId',
                type: 'list',
                message: 'Select the employee to update:',
                choices: employeeChoices,
            },
            {
                name: 'newManagerId',
                type: 'list',
                message: 'Select the new manager for this employee (or None):',
                choices: [{ name: 'None', value: null }, ...employeeChoices],
            },
        ]);
    })
        .then((answers) => {
        const query = 'UPDATE employee SET manager_id = $1 WHERE id = $2';
        db.query(query, [answers.newManagerId, answers.employeeId])
            .then(() => {
            console.log('Employee manager updated successfully!');
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    })
        .catch((err) => console.error('Error:', err));
}
function deleteDepartment() {
    db.query('SELECT * FROM department')
        .then((res) => {
        const departmentChoices = res.rows.map((dept) => ({
            name: dept.name,
            value: dept.id,
        }));
        return inquirer.prompt([
            {
                name: 'departmentId',
                type: 'list',
                message: 'Select the department to delete:',
                choices: departmentChoices,
            },
        ]);
    })
        .then((answer) => {
        const query = 'DELETE FROM department WHERE id = $1';
        db.query(query, [answer.departmentId])
            .then(() => {
            console.log('Department deleted successfully!');
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    });
}
function deleteRole() {
    db.query('SELECT * FROM role')
        .then((res) => {
        const roleChoices = res.rows.map((role) => ({
            name: role.title,
            value: role.id,
        }));
        return inquirer.prompt([
            {
                name: 'roleId',
                type: 'list',
                message: 'Select the role to delete:',
                choices: roleChoices,
            },
        ]);
    })
        .then((answer) => {
        const query = 'DELETE FROM role WHERE id = $1';
        db.query(query, [answer.roleId])
            .then(() => {
            console.log('Role deleted successfully!');
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    });
}
function deleteEmployee() {
    db.query('SELECT * FROM employee')
        .then((res) => {
        const employeeChoices = res.rows.map((emp) => ({
            name: `${emp.first_name} ${emp.last_name}`,
            value: emp.id,
        }));
        return inquirer.prompt([
            {
                name: 'employeeId',
                type: 'list',
                message: 'Select the employee to delete:',
                choices: employeeChoices,
            },
        ]);
    })
        .then((answer) => {
        const query = 'DELETE FROM employee WHERE id = $1';
        db.query(query, [answer.employeeId])
            .then(() => {
            console.log('Employee deleted successfully!');
            loadMainPrompts();
        })
            .catch((err) => console.error('Error:', err));
    });
}
function quit() {
    console.log('Goodbye!');
    process.exit();
}
