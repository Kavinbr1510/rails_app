class BuyerRequest < ApplicationRecord
  belongs_to :product
  belongs_to :buyer, class_name: "User"

  enum status: { pending: 0, approved: 1, rejected: 2 }

  validate :buyer_must_be_a_buyer
  validate :product_must_be_approved

  private

  def buyer_must_be_a_buyer
    buyer_role_id = Role.find_by(name: "Buyer")&.id
    if buyer&.role_id != buyer_role_id
      errors.add(:buyer, "must be a Buyer to make a request")
    end
  end

  def product_must_be_approved
    unless product&.approved?
      errors.add(:product, "must be approved by admin to request")
    end
  end
end
