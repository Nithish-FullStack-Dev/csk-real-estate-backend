import Customer from "../modals/customerSchema.js";
import Property from "../modals/propertyModel.js"; // Ensure this import is correct
import User from "../modals/user.js"; // Ensure this import is correct

export const createCustomer = async (req, res) => {
  try {
    const { user, purchasedFrom, properties } = req.body;

    if (
      !user ||
      !purchasedFrom ||
      !properties ||
      !Array.isArray(properties) ||
      properties.length === 0
    ) {
      return res.status(400).json({
        message: "Missing required fields or properties array is invalid",
      });
    }

    for (const prop of properties) {
      if (!prop.property || !prop.bookingDate || !prop.finalPrice) {
        return res.status(400).json({
          message:
            "Each property entry must have property, bookingDate, and finalPrice",
        });
      }
    }

    const newCustomer = new Customer({
      user,
      purchasedFrom,
      properties,
    });

    await newCustomer.save();
    res.status(201).json({ message: "Customer created", data: newCustomer });
  } catch (error) {
    console.error("Error creating customer:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! GET ALL CUSTOMERS
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate("user")
      .populate("purchasedFrom")
      .populate("properties.property")
      .populate("properties.documents");
    res.status(200).json({ data: customers }); // Wrap in data object to match frontend expectation
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! GET SINGLE CUSTOMER
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("user")
      .populate("purchasedFrom")
      .populate("properties.property")
      .populate("properties.documents");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ data: customer }); // Wrap in data object for consistency
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    if (req.body.properties) {
      if (
        !Array.isArray(req.body.properties) ||
        req.body.properties.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Properties array is invalid or empty" });
      }
      for (const prop of req.body.properties) {
        if (!prop.property || !prop.bookingDate || !prop.finalPrice) {
          return res.status(400).json({
            message:
              "Each property entry must have property, bookingDate, and finalPrice",
          });
        }
      }
    }

    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // Ensures schema validators run on update
    });

    if (!updated) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer updated", data: updated });
  } catch (error) {
    console.error("Error updating customer:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! Get Customer by User Id
export const getCustomerByUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customer = await Customer.findOne({ user: userId })
      .populate("user")
      .populate("properties.property")
      .populate("purchasedFrom")
      .populate("properties.documents");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(customer); // Wrap in data object for consistency
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//! Get All Purchased Property
export const getPurchasedProperties = async (req, res) => {
  try {
    const customers = await Customer.find({
      "properties.0": { $exists: true },
    }).populate("properties.property", "basicInfo");

    const result = [];

    customers.forEach((customer) => {
      customer.properties.forEach((p) => {
        if (p.property) {
          result.push({
            _id: p.property._id,
            basicInfo: p.property.basicInfo,
          });
        }
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching basic purchased properties:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
