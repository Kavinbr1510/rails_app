
    class SessionsController < ApplicationController
      skip_before_action :authenticate_request

      def new
        render json: { message: "Please send a POST request with email and password to sign in." }, status: :ok
      end

      def create
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          token = JsonWebToken.encode(user_id: user.id)
          render json: {
            token: token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role.name
            }
          }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def destroy
        render json: { message: "Client can delete the token locally to sign out." }, status: :ok
      end
    end
