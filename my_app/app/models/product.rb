class Product < ApplicationRecord
  belongs_to :seller, class_name: "User"
  has_many :buyer_requests

  enum :admin_status, { pending: 0, approved: 1, rejected: 2 }

  validate :seller_must_be_a_seller

  validate :no_updates_after_approval_or_rejection, if: :finalized?

  validate :approved_by_must_be_admin, if: :will_save_change_to_admin_status?


  private

  def seller_must_be_a_seller
    seller_role_id = Role.find_by(name: "Seller")&.id
    if seller&.role_id != seller_role_id
      errors.add(:seller, "must be a Seller to create a product")
    end
  end


  def finalized?
    admin_status.in?([ "approved", "rejected" ])
  end


  def no_updates_after_approval_or_rejection
    if admin_status_was.in?([ "approved", "rejected" ])
      errors.add(:base, "Product is finalized and cannot be modified")
    end
  end


  def approved_by_must_be_admin
    admin_role_id = Role.find_by(name: "Admin")&.id
    user = User.find_by(id: approved_by)
    unless user&.role_id == admin_role_id
      errors.add(:approved_by, "must be an Admin to change approval status")
    end
  end
end
