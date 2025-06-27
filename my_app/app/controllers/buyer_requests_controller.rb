class BuyerRequestsController < ApplicationController
  before_action :authenticate_request
  load_and_authorize_resource except: [:index]

  def index
    if current_user.role.name == "Seller"
      @requests = BuyerRequest
                    .joins(:product)
                    .where(products: { seller_id: current_user.id })
                    .includes(:buyer, product: :category)
    elsif current_user.role.name == "Buyer"
      @requests = current_user.buyer_requests.includes(:buyer, product: :category)
    else
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    if params[:status].present?
      valid_statuses = BuyerRequest.statuses.keys.map(&:to_s)
      if params[:status].in?(valid_statuses)
        @requests = @requests.where(status: params[:status])
      end
    end

    if params[:statuses].present?
      valid_statuses = BuyerRequest.statuses.keys
      selected = params[:statuses] & valid_statuses.map(&:to_s)
      @requests = @requests.where(status: selected) if selected.any?
    end

    if params[:min_cost].present? && params[:max_cost].present?
      @requests = @requests.joins(:product).where("products.cost BETWEEN ? AND ?", params[:min_cost].to_i, params[:max_cost].to_i)
    elsif params[:min_cost].present?
      @requests = @requests.joins(:product).where("products.cost >= ?", params[:min_cost].to_i)
    elsif params[:max_cost].present?
      @requests = @requests.joins(:product).where("products.cost <= ?", params[:max_cost].to_i)
    end

    if params[:category_id].present?
      @requests = @requests.joins(:product).where(products: { category_id: params[:category_id].to_i })
    end

    if params[:start_date].present?
      begin
        start_datetime = Time.zone.parse(params[:start_date]).beginning_of_day
        @requests = @requests.where("buyer_requests.created_at >= ?", start_datetime)
      rescue ArgumentError => e
        return render json: { error: "Invalid start_date format: #{e.message}" }, status: :unprocessable_entity
      end
    end

    if params[:end_date].present?
      begin
        end_datetime = Time.zone.parse(params[:end_date]).end_of_day
        @requests = @requests.where("buyer_requests.created_at <= ?", end_datetime)
      rescue ArgumentError => e
        return render json: { error: "Invalid end_date format: #{e.message}" }, status: :unprocessable_entity
      end
    end

    render json: @requests.map { |r|
      product_serialized_data = r.product ? ProductSerializer.new(r.product, scope: current_user).as_json : nil
      r.as_json.merge(buyer_name: r.buyer.name, product: product_serialized_data)
    }, status: :ok
  end

  def create
    @buyer_request = BuyerRequest.new(buyer_request_params)
    @buyer_request.buyer = current_user

    if @buyer_request.save
      render json: { message: "Request sent", buyer_request: @buyer_request }, status: :created
    else
      render json: { error: "Unable to send request", details: @buyer_request.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def approve_by_seller
    request = BuyerRequest.find_by(id: params[:id])

    if request
      product = request.product

      if product.seller_id == current_user.id
        if params[:status].in?(%w[approved rejected])
          if request.update(status: params[:status].to_sym, approved_by: current_user.id)
            render json: { message: "Request updated", buyer_request: request }, status: :ok
          else
            render json: { error: "Validation failed", details: request.errors.full_messages }, status: :unprocessable_entity
          end
        else
          render json: { error: "Invalid status" }, status: :unprocessable_entity
        end
      else
        render json: { error: "Unauthorized action" }, status: :unauthorized
      end
    else
      render json: { error: "Request not found" }, status: :not_found
    end
  end

  private

  def buyer_request_params
    params.require(:buyer_request).permit(:product_id)
  end
end