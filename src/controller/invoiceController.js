import Invoice from "../modals/invoice.js";
import Project from "../modals/projects.js";
import mongoose from "mongoose";
import Payment from "../modals/payment.js";
import { createNotification } from "../utils/notificationHelper.js";
import User from "../modals/user.js";

export const createInvoice = async (req, res) => {
  try {
    const user = req.user._id;
    const role = req.user.role;

    const {
      project,
      task,
      issueDate,
      dueDate,
      items,
      sgst = 0,
      cgst = 0,
      notes,
      unit,
      floorUnit,
    } = req.body;

    // 🔥 VALIDATION (important)
    if (
      !project ||
      !issueDate ||
      !dueDate ||
      !unit ||
      !floorUnit ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error: "Missing required fields or invoice items",
      });
    }

    // 🔥 SAFE subtotal calculation
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = quantity * rate;

      item.amount = amount;
      return sum + amount;
    }, 0);

    const sgstAmount = (Number(sgst) / 100) * subtotal;
    const cgstAmount = (Number(cgst) / 100) * subtotal;
    const total = subtotal + sgstAmount + cgstAmount;

    const invoice = new Invoice({
      project,
      task: task || null,
      user,
      issueDate,
      dueDate,
      items,
      sgst,
      cgst,
      notes,
      subtotal,
      total,
      unit,
      floorUnit,
      createdRole: role,
      createdBy: req.user._id,
      remainingAmount: total,
    });

    // ✅ _id already exists
    const shortId = invoice._id.toString().slice(0, 6);
    const year = new Date().getFullYear();

    invoice.invoiceNumber = `INV-${year}-${shortId.toUpperCase()}`;

    await invoice.save(); // ✅ only once

    return res.status(201).json(invoice);
  } catch (error) {
    console.error("Invoice creation error:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

export const getCompletedTasksForContractor = async (req, res) => {
  try {
    const contractor = req.user._id;

    if (!contractor || !mongoose.Types.ObjectId.isValid(contractor)) {
      return res
        .status(400)
        .json({ error: "Valid contractor ID is required." });
    }

    // Populate projectId to get actual project details (like name)
    const projects = await Project.find({ contractors: contractor }).populate(
      "projectId",
    );

    const completedTasks = [];

    projects.forEach((project) => {
      project.units.forEach((tasksArray, unitName) => {
        tasksArray.forEach((task) => {
          if (
            task.contractor.toString() === contractor.toString() &&
            task.statusForContractor === "completed" &&
            task.isApprovedByContractor === true &&
            task.isApprovedBySiteManager === true
          ) {
            completedTasks.push({
              taskId: task._id,
              title: task.title,
              unit: unitName,
              projectId: project._id,
              projectName: project.projectId.projectName || "Unknown Project",
              submittedOn: task.submittedByContractorOn,
              deadline: task.deadline,
            });
          }
        });
      });
    });

    res.status(200).json({ tasks: completedTasks });
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let invoices;

    // Filter invoices based on role
    if (role === "contractor") {
      invoices = await Invoice.find({
        user: userId,
        isDeleted: false,
      }).sort({ issueDate: -1 });
    } else if (role === "accountant") {
      invoices = await Invoice.find({
        isDeleted: false,
        $or: [{ createdRole: "contractor" }, { user: userId }],
      }).sort({ issueDate: -1 });
    } else if (role === "owner") {
      invoices = await Invoice.find({
        isDeleted: false,
        $or: [{ createdRole: "contractor" }, { user: userId }],
      }).sort({ issueDate: -1 });
    } else if (role === "admin") {
      invoices = await Invoice.find({
        isDeleted: false,
      }).sort({ issueDate: -1 });
    }

    // Populate project → property.basicInfo
    await Promise.all(
      invoices.map(async (invoice) => {
        await invoice.populate([
          {
            path: "project",
            model: "Building",
            select: "_id projectName propertyType",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType",
          },
          {
            path: "user",
            model: "User",
            select: "name email role",
          },
          {
            path: "approvedByAccountant",
            model: "User",
            select: "name email role",
          },
          {
            path: "createdBy",
            model: "User",
            select: "name email role",
          },
          {
            path: "updatedBy",
            model: "User",
            select: "name email role",
          },
        ]);

        // Now add `taskObject` only if `invoice.task` is present
        if (invoice.task && invoice.project?.units) {
          const unitsMap = invoice.project.units;

          for (const [unitName, taskArray] of unitsMap.entries()) {
            const matchedTask = taskArray.find(
              (task) => task._id.toString() === invoice.task.toString(),
            );
            if (matchedTask) {
              // Attach the full task object to the invoice
              invoice._doc.taskObject = matchedTask; // use `_doc` to add virtual field
              invoice._doc.unitName = unitName; // optional: add unit info
              break;
            }
          }
        }
      }),
    );

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update fields
    Object.assign(invoice, req.body);
    invoice.updatedBy = req.user._id;

    // ✅ VERY IMPORTANT — store last accountant who edited
    if (req.user.role === "accountant") {
      invoice.approvedByAccountant = req.user._id;
    }

    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

export const markInvoiceAsPaid = async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, reconciliationAmount, isPaid, reconciledItemId } =
    req.body;
  const reconcile = req.query.reconcile === "true";

  // 🔔 Notification helper (ADDED)
  const notifyRevenueReceived = async (invoice) => {
    const receivers = await User.find({
      role: { $in: ["owner", "accountant"] },
    }).select("_id");

    await Promise.all(
      receivers.map((user) =>
        createNotification({
          userId: user._id,
          title: "Payment Received",
          message: `Invoice ${
            invoice.invoiceNumber || invoice._id
          } has been paid.`,
          triggeredBy: req.user._id,
        }),
      ),
    );
  };

  try {
    if (!reconcile) {
      const invoice = await Invoice.findOne({ _id: id, isDeleted: false });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      invoice.status = "paid";
      invoice.paymentMethod = paymentMethod;
      invoice.paymentDate = new Date();

      // ✅ VERY IMPORTANT
      invoice.approvedByAccountant = req.user._id;
      invoice.updatedBy = req.user._id;

      await invoice.save();

      const payment = new Payment({
        accountant: req.user._id,
        invoice: id,
        paymentNumber: "",
        isDeleted: false,
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      await payment.save();

      const shortId = payment._id.toString().slice(0, 6);
      const year = new Date().getFullYear();
      payment.paymentNumber = `PAY-${year}-${shortId.toUpperCase()}`;
      await payment.save();

      await payment.save(); // update with generated payment number

      // 🔔 Notify Owner + Accountant (ADDED)
      await notifyRevenueReceived(invoice);

      return res
        .status(200)
        .json({ message: "Invoice marked as paid", invoice, payment });
    }

    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Step 1: If reconcile is true, update invoice total and add to reconciliation history
    if (reconcile && reconciliationAmount != null && reconciledItemId) {
      const item = invoice.items.find(
        (it) => it._id.toString() === reconciledItemId.toString(),
      );

      if (!item) {
        return res.status(404).json({ message: "Reconciled item not found" });
      }

      // Update item amount (increase it)
      item.amount += reconciliationAmount;

      // Recalculate subtotal from all items
      const newSubtotal = invoice.items.reduce(
        (acc, curr) => acc + curr.amount,
        0,
      );
      invoice.subtotal = newSubtotal;

      // Recalculate tax amounts
      const sgstAmount = (invoice.sgst / 100) * newSubtotal;
      const cgstAmount = (invoice.cgst / 100) * newSubtotal;
      invoice.total = newSubtotal + sgstAmount + cgstAmount;

      // Push to reconciliation history
      invoice.reconciliationHistory.push({
        item: item.description,
        amount: reconciliationAmount,
        method: isPaid ? paymentMethod : "N/A",
        note: isPaid ? "Reconciled and paid" : "Reconciled without payment",
      });

      // If invoice is being paid
      if (isPaid) {
        invoice.status = "paid";
        invoice.paymentDate = new Date();

        if (!invoice.paymentMethod.includes(paymentMethod)) {
          invoice.paymentMethod.push(paymentMethod);
        }
        invoice.updatedBy = req.user._id;
        await invoice.save();

        // 🔔 Notify Owner + Accountant (ADDED)
        await notifyRevenueReceived(invoice);

        return res.status(200).json({
          message: "Invoice reconciled and marked as paid",
          invoice,
        });
      }

      // If only reconciled
      invoice.status = "pending";

      invoice.updatedBy = req.user._id;
      await invoice.save();

      return res.status(200).json({
        message: "Invoice reconciled (not paid)",
        invoice,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const verifyInvoiceByAccountant = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // ✅ update status
    invoice.status = status;

    // ✅ VERY IMPORTANT: save accountant id
    invoice.approvedByAccountant = req.user._id;

    // ✅ save note
    invoice.noteByAccountant = notes || "";
    invoice.updatedBy = req.user._id;

    // ❌ remove old boolean
    invoice.set("isApprovedByAccountant", undefined);

    await invoice.save();

    return res.status(200).json({
      message: `Invoice ${status} successfully`,
      invoice,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMonthlyRevenues = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const revenues = await Invoice.aggregate([
      {
        $match: {
          status: "paid",
          paymentDate: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$paymentDate" },
          total: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthlyRevenues = Array(12).fill(0);
    revenues.forEach((rev) => {
      monthlyRevenues[rev._id - 1] = rev.total;
    });

    res.status(200).json(monthlyRevenues);
  } catch (error) {
    console.error("Error fetching monthly revenues:", error);
    res.status(500).json({ message: "Server error" });
  }
};
