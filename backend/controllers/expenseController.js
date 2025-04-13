const xlsx = require("xlsx");
const Expense = require("../models/Expense");

// Add expense to database
exports.addExpense = async (req, res) => {
  console.log("Incoming Body:", req.body);
  const { title, amount, category } = req.body;

  if (!title || !amount || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const expense = new Expense({
      userId: req.user.id, // ✅ Fixed here
      title,
      amount,
      category,
    });

    await expense.save();

    return res.status(201).json({ message: "Expense added successfully", expense });
  } catch (error) {
    console.error("Error adding expense:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all expenses for logged-in user
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server Error." });
  }
};

// Delete an expense by ID
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id); // ✅ Fixed here
    res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error." });
  }
};

// Download expenses in Excel format
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    const data = expenses.map((item) => ({
      Category: item.category,
      Amount: item.amount,
      Date: item.date.toDateString(),
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Expense");

    const filePath = "expense_details.xlsx";
    xlsx.writeFile(wb, filePath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server Error." });
  }
};
