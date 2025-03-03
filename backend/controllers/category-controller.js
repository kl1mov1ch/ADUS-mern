const { prisma } = require("../prisma/prisma-client");

const CategoryController = {
  // Create a new category
  createCategory: async (req, res) => {
    const { name } = req.body;

    try {
      const category = await prisma.category.create({
        data: { name },
      });

      res.status(201).json(category);
    } catch (err) {
      console.error("Error creating category", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  // Create a new subcategory
  createSubcategory: async (req, res) => {
    const { name, categoryId } = req.body;

    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const subcategory = await prisma.subcategory.create({
        data: {
          name,
          categoryId,
        },
      });

      res.status(201).json(subcategory);
    } catch (err) {
      console.error("Error creating subcategory", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  // Update a category
  updateCategory: async (req, res) => {
    const { categoryId, name } = req.body;

    try {
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { name },
      });

      res.json(updatedCategory);
    } catch (err) {
      console.error("Error updating category", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  deleteCategory: async (req, res) => {
    const { categoryId } = req.params;

    try {
      await prisma.testCategory.deleteMany({
        where: { categoryId: categoryId },
      });

      await prisma.subcategory.deleteMany({
        where: { categoryId: categoryId },
      });

      await prisma.category.delete({
        where: { id: categoryId },
      });

      res.json({ message: "Category deleted successfully" });
    } catch (err) {
      console.error("Error deleting category", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateSubcategory: async (req, res) => {
    const { id, name } = req.body;

    try {
      const updatedSubcategory = await prisma.subcategory.update({
        where: { id: id },
        data: { name },
      });

      res.json(updatedSubcategory);
    } catch (err) {
      console.error("Error updating subcategory", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  // Delete a subcategory
  deleteSubcategory: async (req, res) => {
    const { subcategoryId } = req.params;

    try {
      await prisma.subcategory.delete({
        where: { id: subcategoryId },
      });

      res.json({ message: "Subcategory deleted successfully" });
    } catch (err) {
      console.error("Error deleting subcategory", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        include: {
          subcategories: true,
        },
      })
      res.json(categories);
    } catch (err) {
      console.error("Error fetching categories", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  // Get a single category with its subcategories
  getCategoryById: async (req, res) => {
    const { categoryId } = req.params;

    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          subcategories: true,
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (err) {
      console.error("Error fetching category", err);
      res.status(500).json({ error: "Server Error" });
    }
  },

  getCategoriesAndSubcategoriesForTest: async (req, res) => {
    const { testId } = req.params;
    const testIds = testId.split(',').map(id => id.trim());

    try {
      console.log("Полученные testIds:", testIds);

      const testsWithDetails = await prisma.test.findMany({
        where: {
          id: { in: testIds },
        },
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          subcategories: {
            include: {
              subcategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (testsWithDetails.length === 0) {
        return res.status(404).json({ message: "Tests not found." });
      }

      const result = testsWithDetails.map(test => ({
        testId: test.id,
        title: test.title,
        description: test.description,
        categories: test.categories.map(testCategory => ({
          id: testCategory.category.id,
          name: testCategory.category.name,
        })),
        subcategories: test.subcategories.map(testSubcategory => ({
          id: testSubcategory.subcategory.id,
          name: testSubcategory.subcategory.name,
        })),
      }));
      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error fetching categories and subcategories for tests", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
};

module.exports = CategoryController;
