class DashboardController < ApplicationController
  before_action :require_login

  def index
    if current_user.role.name == "Admin"
      redirect_to dashboard_admin_path
    elsif current_user.role.name == "Seller"
      redirect_to dashboard_seller_path
    elsif current_user.role.name == "Buyer"
      redirect_to dashboard_buyer_path
    end
  end
  def admin
    valid_status = %w[approved rejected pending]
    if params[:status].present? && !valid_status.include?(params[:status])
      redirect_to dashboard_admin_path, alert: "Invalid status provided."
      return
    end
    case params[:status]
    when "approved"
      @products = Product.approved
    when "rejected"
      @products = Product.rejected
    else
      @products = Product.pending
    end
  end

  def seller
    valid_status = %w[pending approved rejected]

    if params[:status].present? && !valid_status.include?(params[:status])
      redirect_to dashboard_seller_path, alert: "Invalid status."
      return
    end
    @products = current_user.products.includes(buyer_requests: :buyer)

    if params[:status].present?
      @products = @products.where(admin_status: params[:status])
    end
  end



  def buyer
    case params[:status]
    when "accepted"
      @products = current_user.buyer_requests.approved.includes(:product).map { |item| item.product }

    when "rejected"
      @products = current_user.buyer_requests.rejected.includes(:product).map { |item| item.product }

    else
      requested_product_ids = current_user.buyer_requests.pluck(:product_id)

      @products = Product.approved.where.not(id: requested_product_ids).left_joins(:buyer_requests)


    end
  end
end
