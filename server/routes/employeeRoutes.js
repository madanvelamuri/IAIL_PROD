const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET Employees
router.get("/", (req, res) => {
  db.all("SELECT * FROM employees ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching employees" });
    res.json(rows);
  });
});

// ADD Employee
router.post("/", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Employee name required" });
  }

  db.run(
    "INSERT INTO employees (name) VALUES (?)",
    [name],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Employee already exists" });
      }
      res.json({ id: this.lastID, name });
    }
  );
});

module.exports = router;