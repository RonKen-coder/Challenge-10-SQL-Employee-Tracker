import inquirer from 'inquirer';
import logo from 'asciiart-logo';
import { pool, connectToDb } from './connection.js';
connectToDb();
const db = pool;

init();

function init() {
  console.log(
    logo({
      name: 'Employee Manager',
      borderColor: 'blue',
      logoColor: 'bold-green',
      textColor: 'white',
    }).render()
  );
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
          'Add a Department',
          'Add a Role',
          'Add an Employee',
          'Update Employee Role',
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

        case 'Add a Department':
          addDepartment();
          break;

        case 'Add  A Role':
          addRole();
          break;

        case 'Add An Employee':
          addEmployee();
          break;

          case 'Update Employee Role':
            updateEmployeeRole();
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
    })
}

function viewAllRoles() {

  db.query('SELECT * FROM role')
    .then((res) => {
      console.table(res.rows);
      loadMainPrompts();
    })
}

function viewEmployees() {

  db.query('SELECT * FROM employee')
    .then((res) => {
      console.table(res.rows);
      loadMainPrompts();
    })
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
      const query = 'INSERT INTO role (title, salary, department_id) VALUES ($1, $1, $1)';
      db.query(query, [answers.roleTitle, answers.roleSalary, answers.departmentId])
        .then(() => {
          console.log(`Added ${answers.roleTitle} to the database.`);
          loadMainPrompts();
        })
        .catch((err) => console.error('Error:', err));
    });
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
      const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $1, $1, $1)';
      db.query(query, [answers.firstName, answers.lastName, answers.roleId, answers.managerId])
        .then(() => {
          console.log(`Added ${answers.firstName} ${answers.lastName} to the database.`);
          loadMainPrompts();
        })
        .catch((err) => console.error('Error:', err));
    });
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
      const query = 'UPDATE employee SET role_id = ? WHERE id = ?';
      db.query(query, [answers.newRoleId, answers.employeeId])
        .then(() => {
          console.log('Employee role updated successfully!');
          loadMainPrompts();
        })
        .catch((err) => console.error('Error:', err));
    });
}



function quit() {
  console.log('Goodbye!');
  process.exit();
}