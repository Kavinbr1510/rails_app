
class RegistrationsController <  ApplicationController
  skip_before_action :authenticate_request, only: [ :create, :new ]
  def new
    @user = User.new
    @roles = Role.where(name: [ "Seller", "Buyer" ])
    render json: {
      user: @user,
      roles: @roles
    }, status: :ok
  end

  def create
    @user = User.new(user_params)

    if @user.save
      token = JsonWebToken.encode(user_id: @user.id)
      render json: {
        message: "Signup successful",
        token: token,
        user: {
          id: @user.id,
          email: @user.email,
          name: @user.name,
          role: @user.role.name
        }
      }, status: :created
    else
      render json: {
        message: "Signup failed",
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :name, :role_id)
  end
end
