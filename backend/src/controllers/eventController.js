// Controller handling core event mechanics
exports.createEvent = async (req, res, next) => {
    try {
        const { name, description, category, event_date, access_control } = req.body;
        
        if (!name || !category || !event_date) {
            return res.status(400).json({ error: "Missing core event parameters (name, category, event_date)." });
        }

        res.status(201).json({ 
            success: true, 
            message: "Event generated seamlessly.", 
            data: { name, description, category, event_date, access_control } 
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllEvents = async (req, res, next) => {
    try {
        const { sortBy, order, category } = req.query;
        
        let query = `SELECT * FROM events WHERE 1=1`;

        // Whitelisting inputs to block SQL Injection vulnerabilities
        const allowedSortFields = ['name', 'event_date', 'category'];
        const allowedOrder = ['ASC', 'DESC'];

        const activeSort = allowedSortFields.includes(sortBy) ? sortBy : 'event_date';
        const activeOrder = allowedOrder.includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';

        if (category) {
            query += ` AND category = '${category}'`;
        }

        query += ` ORDER BY ${activeSort} ${activeOrder};`;

        res.status(200).json({ 
            success: true, 
            message: `Fetched records successfully.`,
            simulatedQuery: query 
        });
    } catch (error) {
        next(error);
    }
};