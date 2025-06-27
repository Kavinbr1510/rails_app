class BuyerRequest < ApplicationRecord
  belongs_to :product
  belongs_to :buyer, class_name: "User"
  belongs_to :approver, class_name: "User", foreign_key: "approved_by", optional: true

  enum status: { pending: 0, approved: 1, rejected: 2 }


  after_initialize :set_default_status, if: :new_record?
  validate :buyer_must_be_a_buyer
  validate :product_must_be_approved
  validate :only_product_seller_can_approve, if: :will_save_change_to_status?
  validate :buyer_cannot_self_approve, if: :will_save_change_to_status?
  after_update :reject_other_requests_if_approved
  validate :no_updates_after_approval_or_rejection, if: :finalized?
# inside BuyerRequest
after_save_commit :update_product_request_count_sync

def update_product_request_count_sync
  product.update_request_count!
end





  private

  def finalized?
    status.in?([ "approved", "rejected" ])
  end


  def no_updates_after_approval_or_rejection
    if status_was.in?([ "approved", "rejected" ])
      errors.add(:base, "buyer is finalized and cannot be modified")
    end
  end

  def set_default_status
    self.status ||= :pending
  end

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

  def only_product_seller_can_approve
    return unless approved? || rejected?

    seller = product&.seller
    unless seller&.id == approved_by
      errors.add(:approved_by, "must be the product seller to approve or reject requests")
    end
  end

  def buyer_cannot_self_approve
    if approved_by.present? && buyer_id == approved_by
      errors.add(:base, "Buyer cannot approve their own request")
    end
  end

  def reject_other_requests_if_approved
    return unless approved?

    BuyerRequest.where(product_id: product_id).where.not(id: id).update_all(status: :rejected)
  end
end
