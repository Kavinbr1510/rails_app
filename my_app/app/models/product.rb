class Product < ApplicationRecord
  belongs_to :seller, class_name: "User"
  belongs_to :category, optional: true
  has_many :buyer_requests

  has_one_attached :image

  enum :admin_status, { pending: 0, approved: 1, rejected: 2 }
  attribute :visible, :boolean, default: false

  validate :seller_must_be_a_seller
  validate :no_updates_after_approval_or_rejection, if: :finalized?
  validate :approved_by_must_be_admin, if: :will_save_change_to_admin_status?

  include Rails.application.routes.url_helpers
  def update_request_count!
    requests = BuyerRequest.where(product_id: id)
  
    count = if requests.where(status: "approved").exists?
              approved_time = requests.find_by(status: "approved").created_at
              requests.where("created_at <= ?", approved_time).count
            else
              requests.count
            end
  
    Rails.logger.debug "✅ Updating Product(#{id}) request_count to #{count}"
    update_column(:request_count, count)
  end
  
  
  
  
  
  
  

  private

  def seller_must_be_a_seller
    seller_role_id = Role.find_by(name: "Seller")&.id
    errors.add(:seller, "must be a Seller to create a product") if seller&.role_id != seller_role_id
  end

  def finalized?
    admin_status.in?(["approved", "rejected"])
  end

  def no_updates_after_approval_or_rejection
    errors.add(:base, "Product is finalized and cannot be modified") if admin_status_was.in?(["approved", "rejected"])
  end

  def approved_by_must_be_admin
    admin_role_id = Role.find_by(name: "Admin")&.id
    user = User.find_by(id: approved_by)
    errors.add(:approved_by, "must be an Admin to change approval status") unless user&.role_id == admin_role_id
  end
 
  
  
  
end
