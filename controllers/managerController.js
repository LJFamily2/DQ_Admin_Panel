const ManagerModel = require("/models/managerModel");
const handleResponse = require("./utils/responseHandler");

async function createManager(req,res) {
    try {
        // Extract form data from request body
        const { name, phone, address, plantation } = req.body;

        // Create a new manager instance
        const newManager = new ManagerModel({
            name,
            phone,
            address,
            plantation
        });

        // Save the manager to the database
        await newManager.save();

        // Respond with success message
        handleResponse.success(res, 'Manager created successfully');
    } catch (error) {
        // Log and respond with error message
        console.error(error);
        handleResponse.error(res, 'Failed to create manager', 500);
    }
} 