["Admin", "Seller", "Buyer"].each do |role_name|
  Role.find_or_create_by(name: role_name)
end

User.create!(
  name: "admin",
  email: "admin@gmail.com",
  password: "Admin@123", 
  role_id: Role.find_by(name: "Admin").id
)
