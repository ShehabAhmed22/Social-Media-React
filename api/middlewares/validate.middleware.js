export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      status: "error",
      message: errors[0].message, // أول error للـ frontend
      errors, // كل الـ errors للـ debugging
    });
  }

  req.body = result.data; // استبدل الـ body بالـ data النظيفة
  next();
};
