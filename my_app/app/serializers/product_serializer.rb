class ProductSerializer < ActiveModel::Serializer
  attributes :id, :product_name, :cost, :admin_status, :visible,
             :category_id, :image_url, :request_count,
             :buyer_request_status, :has_requested

  belongs_to :seller
  belongs_to :category

  def image_url
    object.image.attached? ? Rails.application.routes.url_helpers.url_for(object.image) : nil
  end

  def request_count
    object.visible? ? object.request_count : nil
  end

  def buyer_request_status
    return nil unless buyer?

    req = object.buyer_requests.find_by(buyer_id: scope.id)
    req&.status || "not_requested"
  end

  def has_requested
    return nil unless buyer?

    object.buyer_requests.exists?(buyer_id: scope.id)
  end

  private

  def buyer?
    scope&.role&.name == "Buyer"
  end
end
