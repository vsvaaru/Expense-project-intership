const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types } = require("mongoose");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    //fetch total income and expense
    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // console.log("total income = ", {
    //   totalIncome,
    //   userId: isValidObjectId(userId),
    // });

    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    //Get income transactions in the last 60 days
    const last60DaysIncomeTransaction = await Income.find({
      userId,
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    //get total income last 60 days
    const last60DaysIncome = last60DaysIncomeTransaction.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    //get expense transaction last 30 days
    const last30DaysExpenseTransaction = await Expense.find({
      userId,
      date: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    //get total expense last 30 days
    const last30DaysExpese = last30DaysExpenseTransaction.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    // console.log(last30DaysExpese);

    //fetch last 5 transaction (income + expense)
    const lastTransactions = [
      ...(await Income.find({ userId }).sort({ date: -1 }).limit(5)).map(
        (txn) => ({
          ...txn.toObject(),
          type: "income",
        })
      ),
      ...(await Expense.find({ userId }).sort({ date: -1 }).limit(5)).map(
        (txn) => ({
          ...txn.toObject(),
          type: "expense",
        })
      ),
    ].sort((a, b) => b.date - a.date); //sort latest first

    //final Response
    res.json({
      totalBalance: (totalIncome[0]?.total || 0) - totalExpense[0]?.total,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total,
      last30DaysExpese: {
        total: last30DaysExpese,
        transaction: last30DaysExpenseTransaction,
      },
      last60DaysIncome: {
        total: last60DaysIncome,
        transaction: last60DaysIncomeTransaction,
      },
      recentTransaction: lastTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
