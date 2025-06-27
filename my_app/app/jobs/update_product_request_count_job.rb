class UpdateProductRequestCountJob < ApplicationJob
  queue_as :default

  def perform(product_id)
    product = Product.find_by(id: product_id)
    product&.update_request_count!
  end
end
